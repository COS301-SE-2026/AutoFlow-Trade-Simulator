import asyncio
import logging
import secrets
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Callable, Dict, List, Optional, Tuple

from fastapi import WebSocket
from sqlmodel import Session, select
from sqlalchemy import update


from ...models.multiplayer_match import MultiplayerMatch, MultiplayerParticipant, MatchStatus
from ...models.scenario import Scenario
from ..market_data.generator import LCGPseudoRandomGenerator
from ..simulation.SimulationService import SimulationService
from .MatchSession import MatchSession, PlayerState
from .PerturbationService import perturb_bars

logger = logging.getLogger(__name__)

DEFAULT_INITIAL_BALANCE = Decimal("100000")
PERTURBATION_VERSION: str = "v1"
DATA_SNAPSHOT_ID: str = "demo"
MATCH_RATE_LIMIT_SECONDS: float = 15.0
ORPHAN_ABANDON_AGE_SECONDS: float = 3600.0


@dataclass
class Connection:
    user_id: int
    socket: WebSocket
    match_id: Optional[int] = None


class MultiplayerService:
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.active_connections: List[Connection] = []
        self.active_matches: Dict[int, MatchSession] = {}
        self.queue_lock = asyncio.Lock()
        self.session_factory = session_factory
        self._recent_match_pairs: Dict[Tuple[int, int], float] = {}
        self._abandon_orphaned_matches()

    def _pair_key(self, a: int, b: int) -> Tuple[int, int]:
        return (min(a, b), max(a, b))

    def _abandon_orphaned_matches(self) -> None:
        try:
            with self.session_factory() as db:
                stale_before = datetime.now(timezone.utc) - timedelta(
                    seconds=ORPHAN_ABANDON_AGE_SECONDS
                )
                db.exec(
                    update(MultiplayerMatch)
                    .where(MultiplayerMatch.status == MatchStatus.in_progress)
                    .where(MultiplayerMatch.started_at < stale_before)
                    .values(
                        status=MatchStatus.abandoned,
                        ended_at=datetime.now(timezone.utc),
                    )
                )
                db.commit()
        except Exception:
            logger.exception("Failed to abandon orphaned matches at startup")

    def get_connection(self, user_id: int) -> Connection:
        for connection in self.active_connections:
            if connection.user_id == user_id:
                return connection
        raise ValueError(f"No connection found for user_id={user_id}")

    async def connect(self, websocket: WebSocket, user_id: int) -> Connection:
        await websocket.accept()

        existing = [c for c in self.active_connections if c.user_id == user_id]
        for old in existing:
            self.active_connections.remove(old)
            try:
                await old.socket.close()
            except Exception:
                pass

        connection = Connection(user_id=user_id, socket=websocket)
        self.active_connections.append(connection)
        return connection

    async def disconnect(self, user_id: int, socket: WebSocket) -> None:
        connection = None
        for c in self.active_connections:
            if c.user_id == user_id and c.socket is socket:
                connection = c
                break

        if connection is None:
            return

        if connection.match_id is not None:
            match = self.active_matches.get(connection.match_id)
            if match is not None:
                try:
                    await match.handle_disconnect(user_id)
                except Exception:
                    logger.exception(
                        "handle_disconnect failed for user %s in match %s",
                        user_id,
                        connection.match_id,
                    )

        try:
            self.active_connections.remove(connection)
        except ValueError:
            pass

    async def receive_text(self, websocket: WebSocket) -> str:
        return await websocket.receive_text()

    def get_match(self, match_id: int) -> Optional[MatchSession]:
        return self.active_matches.get(match_id)

    def remove_match(self, match_id: int) -> None:
        self.active_matches.pop(match_id, None)

    def find_active_match_for_user(self, user_id: int) -> Optional[MatchSession]:
        for match in self.active_matches.values():
            if user_id in match.players and match.status == MatchStatus.in_progress:
                return match
        return None

    def pick_scenario_for_players(self) -> Scenario:
        with self.session_factory() as db:
            scenarios = list(
                db.exec(
                    select(Scenario)
                    .where(Scenario.active.is_(True))
                    .order_by(Scenario.id)
                ).all()
            )
        if not scenarios:
            raise ValueError("No active scenarios configured")
        rng = LCGPseudoRandomGenerator(seed=secrets.randbits(31))
        return rng.choice(scenarios)

    async def find_match(self, connection: Connection) -> Optional[MatchSession]:
        async with self.queue_lock:
            waiting = [
                c for c in self.active_connections
                if c.match_id is None and c.user_id != connection.user_id
            ]
            if not waiting:
                return None

            peer = waiting[0]

            key = self._pair_key(peer.user_id, connection.user_id)
            now = time.monotonic()
            last = self._recent_match_pairs.get(key, 0.0)
            if now - last < MATCH_RATE_LIMIT_SECONDS:
                logger.warning(
                    "Rate-limited match for pair %s (%.1fs since last)",
                    key,
                    now - last,
                    )
                try:
                    await connection.socket.close(code=1013, reason="rate_limited")
                except Exception:
                    pass
                return None
            self._recent_match_pairs[key] = now

            scenario = self.pick_scenario_for_players()

            player_one = PlayerState(user_id=peer.user_id, socket=peer.socket)
            player_two = PlayerState(user_id=connection.user_id, socket=connection.socket)

            seed = secrets.randbits(31)

            with self.session_factory() as db:
                match = MultiplayerMatch(
                    scenario_id=scenario.id,
                    symbol=scenario.symbol,
                    start_date=scenario.start_date,
                    end_date=scenario.end_date,
                    initial_balance=DEFAULT_INITIAL_BALANCE,
                    perturbation_seed=seed,
                    player_one_id=peer.user_id,
                    player_two_id=connection.user_id,
                    perturbation_version=PERTURBATION_VERSION,
                    data_snapshot_id=DATA_SNAPSHOT_ID,
                )
                db.add(match)
                db.commit()
                db.refresh(match)
                assert match.id is not None
                match_id = match.id

                sim_service = SimulationService(db)
                base_bars = sim_service.load_bars(scenario.symbol, scenario.start_date, scenario.end_date)
                rng = LCGPseudoRandomGenerator(seed=seed)
                perturbed_bars = perturb_bars(base_bars, rng)

                for user_id in (peer.user_id, connection.user_id):
                    participant = MultiplayerParticipant(
                        match_id=match_id,
                        user_id=user_id,
                        cash_balance=DEFAULT_INITIAL_BALANCE,
                    )
                    db.add(participant)
                db.commit()

            session = MatchSession(
                match_id=match_id,
                seed=seed,
                perturbed_bars=perturbed_bars,
                scenario_id=scenario.id,
                symbol=scenario.symbol,
                start=scenario.start_date,
                end=scenario.end_date,
                initial_balance=DEFAULT_INITIAL_BALANCE,
                players=[player_one, player_two],
                session_factory=self.session_factory,
                on_finished=self.remove_match,
            )
            await session.announce()

            connection.match_id = match_id
            peer.match_id = match_id
            self.active_matches[match_id] = session
            session.start()
            return session