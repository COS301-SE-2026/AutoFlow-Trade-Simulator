import math
from .GreeksDTOs import EpicStatusDTO, GreekValues
from scipy.stats import norm

class GreeksService:
    
    def __init__(self):
        pass
    
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
            return norm.cdf(d1)
        elif option_type == "put":
            return norm.cdf(d1) - 1
        raise ValueError("option_type must be 'call' or 'put'")

    @staticmethod
    def gamma(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        """   
        Gamma: change in Delta per $1 change in the underlying.
        Identical for calls and puts.
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        return norm.pdf(d1) / (current_price * sigma * math.sqrt(time_to_expire))

    @staticmethod
    def theta(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        """
        Theta: change in option price per year of time passing (time decay).
        Returned per year — divide by 365 for a per-day figure.
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        d2 = GreeksService.calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma)
        term1 = -(current_price * norm.pdf(d1) * sigma) / (2 * math.sqrt(time_to_expire))
        if option_type == "call":
            term2 = interest_rate * strike_price * math.exp(-interest_rate * time_to_expire) * norm.cdf(d2)
            return term1 - term2
        elif option_type == "put":
            term2 = interest_rate * strike_price * math.exp(-interest_rate * time_to_expire) * norm.cdf(-d2)
            return term1 + term2
        raise ValueError("option_type must be 'call' or 'put'")


    @staticmethod
    def vega(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        """
        Vega: change in option price per 1.00 (100 percentage points) change
        in volatility. Identical for calls and puts.
        Divide by 100 to express as price change per 1 vol *point* (e.g. 20% -> 21%).
        """
        d1 = GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma)
        return current_price * norm.pdf(d1) * math.sqrt(time_to_expire)
    

    @staticmethod
    def rho(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        """
        Rho: change in option price per 1.00 (100 percentage points) change
        in the risk-free rate. Divide by 100 for change per 1% rate move.
        """
        d2 = GreeksService.calc_d2(current_price, strike_price, time_to_expire, interest_rate, sigma)
        if option_type == "call":
            return strike_price * time_to_expire * math.exp(-interest_rate * time_to_expire) * norm.cdf(d2)
        elif option_type == "put":
            return -strike_price * time_to_expire * math.exp(-interest_rate * time_to_expire) * norm.cdf(-d2)
        raise ValueError("option_type must be 'call' or 'put'")

    @staticmethod
    def get_greeks(symbol:str)->GreekValues:
        
        
