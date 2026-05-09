from .CoreDTOs import DemoResponseDTO
from ...mock_data import generate_price_series


class CoreService:
    @staticmethod
    def get_health() -> dict[str, str]:
        return {"status": "ok"}

    @staticmethod
    def get_demo() -> DemoResponseDTO:
        return DemoResponseDTO(
            message="AutoFlow backend is ready.",
            active_users=len(generate_price_series()),
        )
