from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from sqlmodel import Session, select
from fastapi import HTTPException

from app.epics.market_data.MarketDataService import MarketDataService
from app.epics.market_data.tickers import Symbols, profiles
from app.models.report import Report, Period
from app.models.report_section import ReportSection


class ReportGenService:
    def __init__(self):
        self.market_service = MarketDataService()
    
    def generate_report(self, user_id: int, period_string: str, db: Session) -> ReportSection:
        # Check the period to see what type of report will need to be created
        allowed_periods = ["daily", "weekly"]
        if period_string not in allowed_periods:
            raise HTTPException(
                status_code=422,
                detail="Invalid time frame"
            )
        
        report_period = Period.Daily if period_string == "daily" else Period.Weekly
        count = 2 if report_period == Period.Daily else 7

        # The report row in the report table must exist before the acc report can be made
        db_report = Report(
            user_id=user_id,
            period=report_period,
            generated_at=datetime.now(timezone.utc)
        )
        db.add(db_report)
        db.flush()

        # Read the ticker file and get an appropriate symbol
        for symbol in Symbols:
            if symbol not in profiles:
                continue

            # construct the payload for the wonderful generation logic
            payload = {
                "symbol": symbol,
                "interval": "1d",
                "count": count
            }

            # Keeping the generator execution INSIDE the loop block
            try:
                historical_bars = self.market_service.generate_history(payload)

                if not historical_bars or len(historical_bars) < 2:
                    continue  # Incase there isnt enough data to warrant a generation

            except Exception as e:
                continue

            # compute other metrics that are needed for the graph generation
            latest_bar = historical_bars[-1]
            baseline_bar = historical_bars[0]

            open_price = Decimal(str(baseline_bar["open"]))
            close_price = Decimal(str(latest_bar["close"]))

            period_high = Decimal(str(max(bar["high"] for bar in historical_bars)))
            period_low = Decimal(str(min(bar["low"] for bar in historical_bars)))

            # make the pct_change
            baseline_close = baseline_bar["close"]
            if baseline_close != 0:
                pct_change = ((latest_bar["close"] - baseline_close) / baseline_close) * 100
            else:
                pct_change = 0.0

            # Build row for report section and do some appending
            db_section = ReportSection(
                report_id=db_report.id,
                ticker=symbol,
                open_price=open_price,
                close_price=close_price,
                pct_change=float(pct_change),
                period_high=period_high,
                period_low=period_low
            )
            db.add(db_section)

            return db_section

        # Now acc add everything to the db
        try:
            db.commit()
            db.refresh(db_report)
            return db_report
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to persist generated report: {str(e)}"
            )
    
    def get_user_report_history(self, user_id: int, db: Session) -> List[ReportSection]:
    #you need this to read the db
        try:
           statement = (
                select(ReportSection)
                .join(Report)
                .where(Report.user_id == user_id)
           )
           sections = db.exec(statement).all()
           return sections
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve report history: {str(e)}"
            )