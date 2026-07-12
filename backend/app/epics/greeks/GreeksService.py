import math

from fastapi import HTTPException, status
from sqlmodel import Session, select,col
from ...models.HistPrice import HistPrice
from ...models.MarketCondition import MarketCondition
from ...models.greeks import Greeks
from .GreeksDTOs import EpicStatusDTO, HistPriceHistoryItem, HistPriceHistoryResponse, GreekValues, MarketConditionResponse, TimePeriod
from datetime import datetime,timedelta

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

        match period:
            case TimePeriod.ONE_DAY:

                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(days=1)))
                ).all()
            case TimePeriod.ONE_WEEK:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=1)))
                ).all()

            case TimePeriod.ONE_MONTH:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=4)))
                ).all()

            case TimePeriod.THREE_MONTHS:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=12)))
                ).all()

            case TimePeriod.SIX_MONTHS:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=26)))
                ).all()
            case TimePeriod.ONE_YEAR:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=52)))
                ).all()

            case TimePeriod.FIVE_YEARS:
                price_rows = self.session.exec(
                    select(HistPrice)
                    .where(HistPrice.symbol == normalized_symbol)
                    .where(HistPrice.date >= (datetime.now() - timedelta(weeks=260)))
                ).all()

        if not price_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No historical prices found for symbol '{normalized_symbol}'",
            )

        history = [
            HistPriceHistoryItem(
                asset_id=row.asset_id,
                symbol=row.symbol,
                volume=row.volume,
                open_price=row.open_price,
                high_price=row.high_price,
                low_price=row.low_price,
                official_close=row.offical_close,
                timestamp=row.date,
            )
            for row in sorted(price_rows, key=lambda row: row.date)
        ]

        return HistPriceHistoryResponse(symbol=normalized_symbol, history=history)
    
    def get_market_condition(self) -> MarketConditionResponse:
        latest_market_condition = self.session.exec(select(MarketCondition).order_by(col(MarketCondition.date).desc())).first()


        if latest_market_condition is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No market condition data found",
            )

        return MarketConditionResponse(market_condition=latest_market_condition.condition.value)
    
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


