from pydantic import BaseModel


class EpicStatusDTO(BaseModel):
    epic: str
    status: str
