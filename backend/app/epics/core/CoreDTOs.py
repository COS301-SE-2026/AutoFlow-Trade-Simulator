from pydantic import BaseModel


class DemoResponseDTO(BaseModel):
    message: str
    active_users: int
