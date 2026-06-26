from datetime import datetime, timedelta
from decimal import Decimal
from sqlmodel import Session, select
from .CacheMarketDataDTO import CacheMarketDataDTO

class TTL:
    market_data: CacheMarketDataDTO

    def __init__(self, cache_dto: CacheMarketDataDTO):
        self.market_data = cache_dto

    #To stop the need for making a new class every time just set the data here
    def set_market_data(self, cache_dto: CacheMarketDataDTO):
        self.market_data = cache_dto

    def add_to_cache(self, db:Session):

        #Need a try catch for DB stuff just like asp.net
        try:
            #new item must insert

            new_record = MarketDataCache(
                asset_id=self.market_data.asset_id,
                last_price=self.market_data.last_price,
                bid_price=self.market_data.bid_price,
                ask_price=self.market_data.ask_price,
                bid_size=self.market_data.bid_size,
                ask_size=self.market_data.ask_size,
                total_volume=self.market_data.total_volume,
                open_price=self.market_data.open_price,
                high_price=self.market_data.high_price,
                low_price=self.market_data.low_price,
                official_close=self.market_data.official_close,
                trading_status=self.market_data.trading_status,
                exchange_timestamp=self.market_data.exchange_timestamp,
                )
            db.add(new_record)
    
            db.commit()

        except Exception as e:
            db.rollback()
            raise e
