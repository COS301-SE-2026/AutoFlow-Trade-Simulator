import math
from scipy.stats import norm

class GreeksService:
    
    def __init__(self):
        pass
    
    
    @staticmethod
    def calc_d1(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        return (math.log(current_price / strike_price) + (interest_rate + 0.5 * sigma ** 2) * time_to_expire) / (sigma * math.sqrt(time_to_expire))

    @staticmethod
    def calc_d2(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float)-> float:
        return GreeksService.calc_d1(current_price, strike_price, time_to_expire, interest_rate, sigma) - sigma * math.sqrt(time_to_expire)

    @staticmethod
    def delta(current_price:float,strike_price:float,time_to_expire:float,interest_rate:float,sigma:float,option_type:str="call")-> float:
        d1= GreeksService.calc_d1(current_price,strike_price,time_to_expire,interest_rate,sigma)
        if option_type == "call":
            return norm.cdf(d1)
        elif option_type == "put":
            return norm.cdf(d1) - 1
        raise ValueError("option_type must be 'call' or 'put'")
