from fastapi import WebSocket, WebSocketDisconnect
from fastapi import APIRouter, Depends
from typing import Annotated

from ...models.user import User
from ...core.security import get_current_user_ws
from ..multiplayer.MultiplayerService import MultiplayerService

router = APIRouter(prefix="/multiplayer", tags=["Multiplayer"])

multiplayer_service = MultiplayerService()


def get_multiplayer_service() -> MultiplayerService:
    return multiplayer_service


@router.websocket("/ws")
async def open_socket(socket:WebSocket, service: Annotated[MultiplayerService , Depends(get_multiplayer_service)],current_user:User=Depends(get_current_user_ws) ):
    await service.connect(socket, current_user.id)
    try:
        await service.find_match()
        while True:
            data = await service.recieve_text(socket)
            await service.broadcast(f"Message text was: {data}")
    except WebSocketDisconnect:
        await service.disconnect(current_user.id)


