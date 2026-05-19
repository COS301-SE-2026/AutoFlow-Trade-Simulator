from datetime import datetime, timezone
from decimal import decimal
from typing import List
from sqlmodel import import Session, select
from fastapi import HTTPException

from .MarketDataService import MarketDataService
from .tickers import Symbols, profiles
from .models import Report, ReportSection, Period

class ReportGenService:
    def __init__(self):
        self.market_service = MarketDataService()
    
    def generate_report(self, user_id: int, period: Period, db: Session) -> Report:
        #Check the period to see what type of report will need to be created
        count = 2 if period == Period.Daily else 7

        #The report row in the report table must exsist before the acc report can be made
        db_report = Report(
            user_id=user_id,
            period=period,
            generated_at=datetime.now(timezone.utc)
        )
        db.add(db_report)
        db.flush()

        #Read the ticker file and get an appropriate symbol
        for symbol in Symbols:
            if symbol not in profiles:
                continue

        #construct the payload for the wonderfull generation logic
        payload = {
            "symbol": symbol,
            "interval": "1d",
            "count": count
        }

        try:

            historical_bars = self.market_service.generate_history(payload)

            if not historical_bars or len(historical_bars) < 2:
                continue: #Incase there isnt enough data to warrent a generation

        except Exception as e:
            continue
