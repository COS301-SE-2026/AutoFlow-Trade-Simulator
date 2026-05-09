from .UiDTOs import EpicStatusDTO


class UiService:
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="ui",
            status="scaffolded",
        )
