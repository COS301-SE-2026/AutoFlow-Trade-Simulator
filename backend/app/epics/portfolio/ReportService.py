from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlmodel import Session, select
from fastapi import HTTPException

from app.models.report import Report, Period
from app.models.report_section import ReportSection
from app.models.asset import Asset
from app.models.daily_OHLCV import DailyOHLCV
from app.models.portfolio import Portfolio
from app.models.international_account import InternationalAccount
from app.models.transaction import Transaction

#I have to include some stuff for swagger to see here or qube throws a fit

class ReportGenService:
    def __init__(self):
        pass

    #Helper function to so qube stops crying
    def _fetch_historical_bars(self, db: Session, symbol: str, count: int) -> Optional[List[DailyOHLCV]]:
        asset = db.exec(select(Asset).where(Asset.symbol == symbol)).first()
        if asset is None:
            return None

        try:
            recent_bars = db.exec(
                select(DailyOHLCV)
                .where(DailyOHLCV.asset_id == asset.asset_id)
                .order_by(DailyOHLCV.timestamp.desc())
                .limit(count)
            ).all()

            if not recent_bars or len(recent_bars) < 2:
                return None

            return list(reversed(recent_bars))
        except Exception:
            return None

    #another helper function to help calculate the values
    def _calculate_section_metrics(self, historical_bars: List[DailyOHLCV], report_id: int, symbol: str) -> ReportSection:
        latest_bar = historical_bars[-1]
        baseline_bar = historical_bars[0]

        open_price = Decimal(str(baseline_bar.open or 0))
        close_price = Decimal(str(latest_bar.close or 0))

        period_high = Decimal(str(max(float(bar.high or 0) for bar in historical_bars)))
        period_low = Decimal(str(min(float(bar.low or 0) for bar in historical_bars)))

        baseline_close = float(baseline_bar.close or 0)
        latest_close = float(latest_bar.close or 0)

        if baseline_close != 0:
            pct_change = ((latest_close - baseline_close) / baseline_close) * 100
        else:
            pct_change = 0.0

        return ReportSection(
            report_id=report_id,
            ticker=symbol,
            open_price=open_price,
            close_price=close_price,
            pct_change=float(pct_change),
            period_high=period_high,
            period_low=period_low
        )

    def _get_traded_assets(self, db: Session, user_id: int) -> List[Asset]:
        account_ids = db.exec(
            select(InternationalAccount.id)
            .join(Portfolio, InternationalAccount.portfolio_id == Portfolio.id)
            .where(Portfolio.user_id == user_id)
        ).all()
        if not account_ids:
            return []

        asset_ids = db.exec(
            select(Transaction.asset_id)
            .where(Transaction.account_id.in_(account_ids))
            .distinct()
        ).all()
        if not asset_ids:
            return []

        return list(db.exec(select(Asset).where(Asset.asset_id.in_(asset_ids))).all())

    def generate_report(self, user_id: int, period_string: str, db: Session) -> List[ReportSection]:

        #check if a user id is really sent back
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid Identity")

        # Check the period to see what type of report will need to be created
        allowed_periods = ["daily", "weekly"]
        if period_string not in allowed_periods:
            raise HTTPException(
                status_code=422,
                detail="Invalid time frame"
            )

        report_period = Period.Daily if period_string == "daily" else Period.Weekly
        count = 2 if report_period == Period.Daily else 7

        # Only report on assets the user has actually traded
        assets = self._get_traded_assets(db, user_id)
        if not assets:
            raise HTTPException(
                status_code=400,
                detail="No traded assets found for this user"
            )

        # The report row in the report table must exist before the acc report can be made
        db_report = Report(
            user_id=user_id,
            period=report_period,
            generated_at=datetime.now(timezone.utc)
        )
        db.add(db_report)
        db.flush()

        if db_report.id is None:
            raise HTTPException(status_code=500, detail="Failed to initialize row.")

        # Build a report section for every traded asset that has enough historical data
        sections: List[ReportSection] = []
        for asset in assets:
            symbol = asset.symbol
            historical_bars = self._fetch_historical_bars(db, symbol, count)
            if not historical_bars:
                continue

            sections.append(self._calculate_section_metrics(
                historical_bars=historical_bars,
                report_id=db_report.id,
                symbol=symbol
            ))

        if not sections:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="No valid market data is available"
            )

        try:
            for db_section in sections:
                db.add(db_section)
            db.commit()
            for db_section in sections:
                db.refresh(db_section)
            return sections
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to persist generated report: {str(e)}"
            )
    
    #Db helper 
    def get_user_report_history(self, user_id: int, db: Session) -> List[ReportSection]:
        try:
           statement = (
                select(ReportSection)
                .join(Report)
                .where(Report.user_id == user_id)
           )
           sections = list(db.exec(statement).all())
           return sections
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve report history: {str(e)}"
            )