import asyncio
from dataclasses import dataclass
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket
from sqlmodel import Session, select

from ..market_data.generator import LCGPseudoRandomGenerator
from ...models.scenario import Scenario
from .MatchSession import MatchSession, PlayerState

DEFAULT_INITIAL_BALANCE = Decimal("100000")


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

    def pick_random_scenario(self) -> Scenario:
        with self.session_factory() as db:
            scenarios = list(db.exec(select(Scenario).where(Scenario.active == True)).all())
        if not scenarios:
            raise ValueError("No active scenarios configured")
        return LCGPseudoRandomGenerator.choice(scenarios)

    async def find_match(self, connection: Connection) -> Optional[MatchSession]:
        async with self.queue_lock:
            waiting = [
                c for c in self.active_connections
                if c.match_id is None and c.user_id != connection.user_id
            ] #connects current user to the first other user waiting for a game.
            if not waiting:
                return None

            peer = waiting[0]
            scenario = self.pick_random_scenario()

            player_one = PlayerState(user_id=peer.user_id, socket=peer.socket)
            player_two = PlayerState(user_id=connection.user_id, socket=connection.socket)

            session = MatchSession(
                scenario_id=scenario.id,
                symbol=scenario.symbol,
                start=scenario.start_date,
                end=scenario.end_date,
                initial_balance=DEFAULT_INITIAL_BALANCE,
                players=[player_one, player_two],
                session_factory=self.session_factory,
            )
            await session.prepare()

            connection.match_id = session.match_id
            peer.match_id = session.match_id
            self.active_matches[session.match_id] = session
            session.start()
            return session
