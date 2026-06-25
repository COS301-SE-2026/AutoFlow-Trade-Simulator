from datetime import datetime, timedelta
from decimal import Decimal
from sqlmodel import Session
from .CacheMarketDataDTO import CacheMarketDataDTO

class TTL:
    market_data: CacheMarketDataDTO

    def __init__(self, cache_dto: CacheMarketDataDTO)
        self.market_data = cache_dto

    def add_to_cache(self, db:Session)

        now = datetime.now()
        ttl_window = timedelta(minutes=30)
        expiry = now + ttl_window

        asset_id = self.market_data.asset_id

        #Need a try catch for DB stuff just like asp.net
        try:
            statement = select(MarketDataCache).where(MarketDataCache.asset_id == asset_id)
            record = db.exec(statement).first()

            #The record exsists
            if record:
                

        if self.market_data.asset_id is None:
