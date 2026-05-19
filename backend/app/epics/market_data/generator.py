import time
from datetime import datetime, timedelta
from .MarketDataDTOs import MockOHLCV
import json

#This is the random number generator for money
class LCGPseudoRandomGenerator:

    def __init__(self, a=1103515245, c=12345, m=2**31, seed=None):
        self.a = a
        self.c = c
        self.m = m
        self.x0 = seed

        if seed is None:
            self.x0 = int(time.time() * 1000) % self.m

        if self.x0 is None:
            self.x0 = 0

        self.x_prev = (self.a * self.x0 + self.c) % self.m
    
    #helper method to generate the number
    def generate_number(self):
        self.x_prev = (self.a * self.x_prev + self.c) % self.m

        return self.x_prev

    def generate_float(self):
        return self.generate_number() / self.m

    def generate_currency(self, min_price=1.0, max_price=1000000.0):
        raw_price = min_price + (self.generate_float() * (max_price - min_price))

        return round(raw_price, 2)

    def choice(self, options_list):
        index = self.generate_number() % len(options_list)
        return options_list[index]

    def generate_datetime(self, start_date: datetime, end_date: datetime) -> str:

        #calculate the seconds in between the dates and use that to generate the data
        date_seconds = (end_date - start_date).total_seconds()

        random_seconds = self.generate_float() * date_seconds

        random_date = start_date + timedelta(seconds=random_seconds)

        return random_date.isoformat()

    def generate_market_history(self, symbol: str, interval: str, start_date: datetime, count: int, base_price: float):

        #To check what time interval data we are generating
        if interval == "1d":
            time_jump = timedelta(days=1)
        elif interval == "1w":
            time_jump = timedelta(weeks=1)
        elif interval == "1m":
            time_jump = timedelta(days=30)
        else:
            raise ValueError("Supported Intervals are only days weeks and month")

        history = []
        current_time = start_date
        current_open = base_price

        for _ in range(count):
            #Simulate market volatility
            volatility = current_open * 0.03

            #calculate the close based on the open
            current_close = self.generate_currency(current_open - volatility, current_open + volatility)
    
            current_high = max(current_open, current_close) + self.generate_currency(0, volatility * 0.5) # must be higher than low
            current_low = min(current_open, current_close) - self.generate_currency(0, volatility * 0.5) # must be in the dirt or lower than high

            #generate random trading volume
            volume = self.generate_currency(100, 5000)

            dto = MockOHLCV(
                timestamp = current_time.isoformat(),
                symbol = symbol,
                interval = interval,
                open = round(current_open, 2),
                high = round(current_high, 2),
                low = round(current_low, 2),
                close = round(current_close, 2),
                volume = volume
            )
            history.append(dto.model_dump())

            current_open = current_close
            current_time += time_jump

        return history
