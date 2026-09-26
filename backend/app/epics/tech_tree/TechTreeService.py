from fastapi import HTTPException, status
from sqlmodel import Session, select

from ...models.user import User
from ...models.tech_tree import TechTree
from .TechTreeDTOs import (
    EpicStatusDTO,
    PurchaseResponseDTO,
    TechNodeStateDTO,
    TechTreeResponseDTO,
    UnlockCheckDTO,
)


class TechTreeService:
    def __init__(self, session: Session) -> None:
        self.session = session

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Tech Tree",
            status="healthy",
        )

    @staticmethod
    def is_unlocked(user: User, tech_name: str) -> bool:
        return tech_name in (user.upgrades or [])

    def _load_nodes(self) -> list[dict]:
        rows = list(self.session.exec(select(TechTree)).all())
        return [row.node for row in rows]

    def get_tree(self, user: User) -> TechTreeResponseDTO:
        owned = set(user.upgrades or [])
        nodes: list[TechNodeStateDTO] = []

        for node in self._load_nodes():
            name = node["name"]
            prereqs = node.get("prerequisites") or []
            cost = node.get("cost", 0)

            unlocked = name in owned
            available = (
                not unlocked
                and all(p in owned for p in prereqs)
                and user.experience_points >= cost
            )

            nodes.append(
                TechNodeStateDTO(
                    name=name,
                    description=node.get("description", ""),
                    cost=cost,
                    prerequisites=prereqs or None,
                    unlocks=node.get("unlocks") or None,
                    unlocked=unlocked,
                    available=available,
                )
            )

        return TechTreeResponseDTO(
            experience_points=user.experience_points,
            upgrades=list(owned),
            nodes=nodes,
        )

    def check_unlock(self, user: User, tech_name: str) -> UnlockCheckDTO:
        return UnlockCheckDTO(
            tech_name=tech_name,
            unlocked=self.is_unlocked(user, tech_name),
        )

    def purchase_tech(self, user: User, tech_name: str) -> PurchaseResponseDTO:
        if self.is_unlocked(user, tech_name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Technology '{tech_name}' is already unlocked",
            )

        user.upgrades = list(user.upgrades or []) + [tech_name]

        try:
            self.session.add(user)
            self.session.commit()
            self.session.refresh(user)
        except Exception as exc:
            self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        return PurchaseResponseDTO(
            experience_points=user.experience_points,
            upgrades=user.upgrades,
            purchased=tech_name,
        )