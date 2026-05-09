from .MarketDataDTOs import EpicStatusDTO


class MarketDataService:
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="market_data",
            status="scaffolded",
        )
