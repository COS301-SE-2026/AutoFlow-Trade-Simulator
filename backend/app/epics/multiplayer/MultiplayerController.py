from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from ...core.security import get_current_user_ws
from ...database import engine
from ...models.user import User
from .MultiplayerService import MultiplayerService

router = APIRouter(prefix="/multiplayer", tags=["Multiplayer"])

multiplayer_service = MultiplayerService(session_factory=lambda: Session(engine))


def get_multiplayer_service() -> MultiplayerService:
    return multiplayer_service


@router.websocket("/ws")
async def open_socket(
    socket: WebSocket,
    service: Annotated[MultiplayerService, Depends(get_multiplayer_service)],
    current_user: User = Depends(get_current_user_ws),
):
    connection = await service.connect(socket, current_user.id)
    try:
        existing = service.find_active_match_for_user(current_user.id)
        if existing is not None:
            connection.match_id = existing.match_id
            await existing.rebind_socket(current_user.id, socket)
        else:
            await service.find_match(connection)

        while True:
            data = await service.receive_text(socket)
            match = service.get_match(connection.match_id) if connection.match_id else None
            if match is None:
                continue
            try:
                await match.handle_client_message(current_user.id, data)
            except Exception:
                continue
    except WebSocketDisconnect:
        await service.disconnect(current_user.id)
