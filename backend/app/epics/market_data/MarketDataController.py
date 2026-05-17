from fastapi import APIRouter, HTTPException, Response, Depends
from .MarketDataDTOs import MockOHLCV, MarketHistoryReq
from .MarketDataService import MarketDataService


router = APIRouter(prefix="/market-data", tags=["Market Data"])

def get_market_service() -> MarketDataService:
    return MarketDataService()

@router.post("/history")
def create_mock_history(payload: MarketHistoryReq, service: MarketDataService = Depends()):
    try:
        #We going to turn this into a nice python dict and give it to our method
        rawJson = service.generate_history(payload.model_dump(exclude_none=True))

        #return statment
        return Response(content=rawJson, media_type="application/json")
    except ValueError as e:
        raise HTTPException(status_code = 400, detail=str(e))
