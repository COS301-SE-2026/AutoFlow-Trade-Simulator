import math

from fastapi import HTTPException, status
from sqlmodel import Session, select,col
from ...models.asset import Asset
from ...models.daily_OHLCV import DailyOHLCV
from ...models.market_condition import MarketCondition, Condition
from ...models.greeks import Greeks
from .GreeksDTOs import EpicStatusDTO, HistPriceHistoryItem, HistPriceHistoryResponse, GreekValues, MarketConditionResponse, TimePeriod
from datetime import datetime,timedelta

from backend.app.models import daily_OHLCV

class GreeksService:

    DIRECTION_ERROR:str = "option_type must be 'call' or 'put'"

    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _normal_pdf(value: float) -> float:
        return math.exp(-0.5 * value ** 2) / math.sqrt(2 * math.pi)

    @staticmethod
    def _normal_cdf(value: float) -> float:
        return 0.5 * (1.0 + math.erf(value / math.sqrt(2.0)))
    
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="greeks",
            status="healthy",
        )
    
    @staticmethod
    def calc_d1(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        return (math.log(current_price / strike_price) + (interest_rate + 0.5 * sigma ** 2) * time_to_expire) / (sigma * math.sqrt(time_to_expire))

    @staticmethod
    def calc_d2(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        return GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma) - sigma * math.sqrt(time_to_expire)

    @staticmethod
    def delta(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        """
        Delta: change in option price per $1 change in the underlying.
        Range: 0 to 1 for calls, -1 to 0 for puts.
        """
        d1= GreeksService.calc_d1(current_price,strike_price,time_to_expire,interest_rate,sigma)
        if option_type == "call":
            return GreeksService._normal_cdf(d1)
        elif option_type == "put":
            return GreeksService._normal_cdf(d1) - 1
        raise ValueError(GreeksService.DIRECTION_ERROR)

    @staticmethod
    def gamma(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        """   
        Gamma: change in Delta per $1 change in the underlying.
        Identical for calls and puts.
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        return GreeksService._normal_pdf(d1) / (current_price * sigma * math.sqrt(time_to_expire))

    @staticmethod
    def theta(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        """
        Theta: change in option price per year of time passing (time decay).
        Returned per year — divide by 365 for a per-day figure.
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        d2 = GreeksService.calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma)
        term1 = -(current_price * GreeksService._normal_pdf(d1) * sigma) / (2 * math.sqrt(time_to_expire))
        if option_type == "call":
            term2 = interest_rate * strike_price * math.exp(-interest_rate * time_to_expire) * GreeksService._normal_cdf(d2)
            return term1 - term2
        elif option_type == "put":
            term2 = interest_rate * strike_price * math.exp(-interest_rate * time_to_expire) * GreeksService._normal_cdf(-d2)
            return term1 + term2
        raise ValueError(GreeksService.DIRECTION_ERROR)


    @staticmethod
    def vega(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        """
        Vega: change in option price per 1.00 (100 percentage points) change
        in volatility. Identical for calls and puts.
        Divide by 100 to express as price change per 1 vol *point* (e.g. 20% -> 21%).
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        return current_price * GreeksService._normal_pdf(d1) * math.sqrt(time_to_expire)
    

    @staticmethod
    def rho(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        """
        Rho: change in option price per 1.00 (100 percentage points) change
        in the risk-free rate. Divide by 100 for change per 1% rate move.
        """
        d2 = GreeksService.calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma)
        if option_type == "call":
            return strike_price * time_to_expire * math.exp(-interest_rate * time_to_expire) * GreeksService._normal_cdf(d2)
        elif option_type == "put":
            return -strike_price * time_to_expire * math.exp(-interest_rate * time_to_expire) * GreeksService._normal_cdf(-d2)
        raise ValueError(GreeksService.DIRECTION_ERROR)

    
    def get_greeks(self, symbol: str) -> GreekValues:
        normalized_symbol = symbol.upper()

        greek_rows = self.session.exec(
            select(Greeks).where(Greeks.symbol == normalized_symbol)
        ).all()

        greek_row = max(greek_rows, key=lambda row: row.timestamp, default=None)

        if greek_row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No greeks data found for symbol '{normalized_symbol}'",
            )

        return GreekValues(
            delta=float(greek_row.delta),
            gamma=float(greek_row.gamma),
            theta=float(greek_row.theta),
            vega=float(greek_row.vega),
            rho=float(greek_row.rho),
        )

    def get_history(self, symbol: str, period: TimePeriod) -> HistPriceHistoryResponse:
        normalized_symbol = symbol.upper()
        price_rows = None

        """get asset id"""
        asset=self.session.exec(select(Asset).where(Asset.symbol==normalized_symbol)).first()
        assert asset is not None,"Invalid symbol found"
        asset_id=asset.asset_id

        match period:
            case TimePeriod.ONE_DAY:

                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(days=1)))
                ).all()
            case TimePeriod.ONE_WEEK:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=1)))
                ).all()

            case TimePeriod.ONE_MONTH:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=4)))
                ).all()

            case TimePeriod.THREE_MONTHS:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=12)))
                ).all()

            case TimePeriod.SIX_MONTHS:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=26)))
                ).all()
            case TimePeriod.ONE_YEAR:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=52)))
                ).all()

            case TimePeriod.FIVE_YEARS:
                price_rows = self.session.exec(
                    select(DailyOHLCV)
                    .where(DailyOHLCV.asset_id == asset_id)
                    .where(DailyOHLCV.timestamp >= (datetime.now() - timedelta(weeks=260)))
                ).all()

        if not price_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No historical prices found for symbol '{normalized_symbol}'",
            )

        history = [
            HistPriceHistoryItem(
                asset_id=row.asset_id,
                symbol=normalized_symbol,
                volume=row.volume,
                open_price=row.open,
                high_price=row.high,
                low_price=row.low,
                official_close=row.close,
                timestamp=row.timestamp,
            )
            for row in sorted(price_rows, key=lambda row: row.timestamp)
        ]

        return HistPriceHistoryResponse(symbol=normalized_symbol, history=history)
    
    def get_market_condition(self) -> MarketConditionResponse:
        latest_market_condition = self.session.exec(select(MarketCondition).order_by(col(MarketCondition.date).desc())).first()


        if latest_market_condition is not None:
            return MarketConditionResponse(market_condition=latest_market_condition.condition.value)

        # Fallback: compute market condition from recent DailyOHLCV data
        window_days = 30
        cutoff = datetime.now() - timedelta(days=window_days)
        rows = self.session.exec(
            select(DailyOHLCV).where(DailyOHLCV.timestamp >= cutoff)
        ).all()

        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No market condition data found and insufficient price history to compute it",
            )

        # Group by asset_id and compute percent change for each asset over the window
        assets = {}
        for r in rows:
            assets.setdefault(r.asset_id, []).append(r)

        pct_changes = []
        for asset_id, bars in assets.items():
            bars_sorted = sorted(bars, key=lambda b: b.timestamp)
            if len(bars_sorted) < 2:
                continue
            first = bars_sorted[0]
            last = bars_sorted[-1]
            try:
                first_close = float(first.close)
                last_close = float(last.close)
            except Exception:
                continue
            if first_close == 0:
                continue
            pct = (last_close - first_close) / first_close
            pct_changes.append(pct)

        if not pct_changes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insufficient OHLCV history to compute market condition",
            )

        avg_change = sum(pct_changes) / len(pct_changes)

        # Thresholds: 2% over window -> bull, -2% -> bear, otherwise ranging
        threshold = 0.02
        if avg_change >= threshold:
            inferred = Condition.BULL
        elif avg_change <= -threshold:
            inferred = Condition.BEAR
        else:
            inferred = Condition.RANGING

        # Persist inferred market condition for future use
        mc = MarketCondition(date=datetime.now(), condition=inferred)
        self.session.add(mc)
        self.session.commit()

        return MarketConditionResponse(market_condition=inferred.value)
    
    def calc_greeks(self,current_price: float, strike_price: float, time_to_expire: float, interest_rate: float, sigma: float, option_type: str = "call") -> GreekValues:
        delta = GreeksService.delta(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type)
        gamma = GreeksService.gamma(current_price, strike_price, time_to_expire, interest_rate, sigma)
        theta = GreeksService.theta(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type)
        vega = GreeksService.vega(current_price, strike_price, time_to_expire, interest_rate, sigma)
        rho = GreeksService.rho(current_price, strike_price, time_to_expire, interest_rate, sigma, option_type)

        return GreekValues(
            delta=delta,
            gamma=gamma,
            theta=theta,
            vega=vega,
            rho=rho)


