from sqlmodel import SQLModel


class TechNodeDTO(SQLModel):
    name: str
    description: str
    cost: int
    prerequisites: list[str] | None = None
    unlocks: list[str] | None = None


class TechNodeStateDTO(SQLModel):
    name: str
    description: str
    cost: int
    prerequisites: list[str] | None = None
    unlocks: list[str] | None = None
    unlocked: bool
    available: bool


class TechTreeResponseDTO(SQLModel):
    experience_points: int
    upgrades: list[str]
    nodes: list[TechNodeStateDTO]


class PurchaseRequestDTO(SQLModel):
    tech_name: str


class PurchaseResponseDTO(SQLModel):
    experience_points: int
    upgrades: list[str]
    purchased: str


class UnlockCheckDTO(SQLModel):
    tech_name: str
    unlocked: bool


class EpicStatusDTO(SQLModel):
    epic: str
    status: str