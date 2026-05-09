from .PortfolioDTOs import EpicStatusDTO


class PortfolioService:
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="portfolio",
            status="scaffolded",
        )
