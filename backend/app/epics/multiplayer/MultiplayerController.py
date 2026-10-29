import logging
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, WebSocketException, status
from sqlmodel import Session

from ...core.security import get_current_user_ws
from ...database import engine
from ...models.user import User
from .MultiplayerDTOs import ErrorMessage, QueuedMessage
from .MultiplayerService import MultiplayerService

logger = logging.getLogger(__name__)

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
    user_id = current_user.id
    if user_id is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    connection = await service.connect(socket, user_id)
    try:
        existing = service.find_active_match_for_user(user_id)
        if existing is not None:
            connection.match_id = existing.match_id
            await existing.rebind_socket(user_id, socket)
        else:
            try:
                await socket.send_text(QueuedMessage().model_dump_json())
            except Exception:
                logger.exception("Failed to send queued ack to user %s", user_id)
            await service.find_match(connection)

        while True:
            data = await service.receive_text(socket)
            match = service.get_match(connection.match_id) if connection.match_id else None
            if match is None:
                continue
            try:
                await match.handle_client_message(user_id, data)
            except WebSocketDisconnect:
                raise
            except Exception:
                logger.exception("Failed handling message from user %s", user_id)
                await socket.send_text(ErrorMessage(detail="internal error handling message").model_dump_json())
    except WebSocketDisconnect:
        await service.disconnect(user_id, socket)