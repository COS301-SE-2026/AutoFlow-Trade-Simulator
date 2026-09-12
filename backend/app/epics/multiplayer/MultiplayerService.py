from dataclasses import dataclass

from fastapi import WebSocket


@dataclass
class Connection:
    user_id: int
    socket: WebSocket
    match_active: bool = False


class Match:
    def __init__(self, players: list[Connection]) -> None:
        self.players: list[Connection] = players

    async def start_match(self):
        for player in self.players:
            await player.socket.send_text("Match Found")


class MultiplayerService:
    def __init__(self):
        self.active_connections: list[Connection] = []

    def get_connection(self, user_id: int) -> Connection:
        for connection in self.active_connections:
            if connection.user_id == user_id:
                return connection
        raise ValueError(f"No connection found for user_id={user_id}")

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        connection = Connection(user_id=user_id, socket=websocket, match_active=False)
        self.active_connections.append(connection)

    async def disconnect(self, user_id: int):
        connection = self.get_connection(user_id)
        self.active_connections.remove(connection)

    async def recieve_text(self, websocket: WebSocket) -> str:
        return await websocket.receive_text()

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.socket.send_text(message)

    async def find_match(self) -> Match | None:
        waiting = [c for c in self.active_connections if not c.match_active]
        if len(waiting) < 2:
            return None

        player_one, player_two = waiting[0], waiting[1]
        player_one.match_active = True
        player_two.match_active = True

        match = Match(players=[player_one, player_two])
        await match.start_match()
        return match

