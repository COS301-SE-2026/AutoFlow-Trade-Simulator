import asyncio
import secrets
from dataclasses import dataclass
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket
from sqlmodel import Session, select
from sqlalchemy import func


from ...models.multiplayer_match import MultiplayerMatch, MultiplayerParticipant
from ...models.scenario import Scenario
from ..market_data.generator import LCGPseudoRandomGenerator
from ..simulation.SimulationService import SimulationService
from .MatchSession import MatchSession, PlayerState
from .PerturbationService import derive_seed, perturb_bars

DEFAULT_INITIAL_BALANCE = Decimal("100000")
PERTURBATION_VERSION: str = "v1"
DATA_SNAPSHOT_ID: str = "demo"


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

    def get_connection(self, user_id: int) -> Connection:
        for connection in self.active_connections:
            if connection.user_id == user_id:
                return connection
        raise ValueError(f"No connection found for user_id={user_id}")

    async def connect(self, websocket: WebSocket, user_id: int) -> Connection:
        await websocket.accept()
        connection = Connection(user_id=user_id, socket=websocket)
        self.active_connections.append(connection)
        return connection

    async def disconnect(self, user_id: int) -> None:
        connection = self.get_connection(user_id)
        if connection.match_id is not None:
            match = self.active_matches.get(connection.match_id)
            if match is not None:
                await match.handle_disconnect(user_id)
        self.active_connections.remove(connection)

    async def receive_text(self, websocket: WebSocket) -> str:
        return await websocket.receive_text()

    def get_match(self, match_id: int) -> Optional[MatchSession]:
        return self.active_matches.get(match_id)

    def find_active_match_for_user(self, user_id: int) -> Optional[MatchSession]:
        for match in self.active_matches.values():
            if user_id in match.players:
                return match
        return None

    def pick_scenario_for_players(self) -> Scenario:
        with self.session_factory() as db:
            scenarios = list(db.exec(select(Scenario).where(Scenario.active == True).order_by(Scenario.id)).all())
        if not scenarios:
            raise ValueError("No active scenarios configured")
        rng = LCGPseudoRandomGenerator(seed=secrets.randbits(31)) # don't need to store this seed because we store what it chose.
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

            scenario = self.pick_scenario_for_players()

            player_one = PlayerState(user_id=peer.user_id, socket=peer.socket)
            player_two = PlayerState(user_id=connection.user_id, socket=connection.socket)

            with self.session_factory() as db:
                match = MultiplayerMatch(
                    scenario_id=scenario.id,
                    symbol=scenario.symbol,
                    start_date=scenario.start_date,
                    end_date=scenario.end_date,
                    initial_balance=DEFAULT_INITIAL_BALANCE,
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

                seed = secrets.randbits(31)
                match.perturbation_seed = seed
                db.add(match)

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
            )
            await session.announce()

            connection.match_id = match_id
            peer.match_id = match_id
            self.active_matches[match_id] = session
            session.start()
            return session