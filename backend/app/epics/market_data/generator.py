import time
from datetime import datetime, timedelta
from .MarketDataDTOs import MockOHLCV

#This is the random number generator for money
class LCGPseudoRandomGenerator:

    def __init__(self, a=1103515245, c=12345, m=2**31, seed=None):
        self.a = a
        self.c = c
        self.m = m

        if seed is None:
            computed_seed = int(time.time() * 1000)
        else:
            computed_seed = (int(seed) * 2654435761) & 0xFFFFFFFF

        self.x_prev = computed_seed % self.m
    
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

    #Python was shifting params so the test was failing so there was not float drift...
    #Well its future proofed code now!

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
        internal_price = float(base_price)

        #mathematically isloated
        local_x = self.x_prev

        trend = 0.0

        for _ in range(count):
            #Excplicitly advance the sequence.
            local_x = (self.a * local_x + self.c) % self.m
            close_rand = (local_x / self.m) * 2.0 - 1.0

            local_x = (self.a * local_x + self.c) % self.m
            vol_mult = 0.5 + (local_x / self.m) * 2.0

            local_x = (self.a * local_x + self.c) % self.m
            high_rand = local_x / self.m

            local_x = (self.a * local_x + self.c) % self.m
            low_rand = local_x / self.m

            local_x = (self.a * local_x + self.c) % self.m
            vol_rand = local_x / self.m

            trend = (trend * 0.6) + (close_rand * 0.4)

            #Simulate market volatility
            base_vol = 0.05 * vol_mult
            volatility = internal_price * base_vol

            price_change = (trend + close_rand) * volatility
            raw_close = max(1.0, internal_price + price_change)
    
            bar_spread = abs(raw_close - internal_price)
            raw_high = max(internal_price, raw_close) + (high_rand * (volatility + bar_spread * 0.5)) # must be higher than low
            raw_low = max(0.5, min(internal_price, raw_close) - (low_rand * (volatility + bar_spread * 0.5))) # must be in the dirt or lower than high

            #generate random trading volume
            raw_volume = 500.0 + (vol_rand * 15000.0) * (1.0 + (bar_spread / internal_price) * 10.0)

            dto = MockOHLCV(
                timestamp = current_time.isoformat(),
                symbol = symbol,
                interval = interval,
                open = round(internal_price, 2),
                high = round(raw_high, 2),
                low = round(raw_low, 2),
                close = round(raw_close, 2),
                volume = round(raw_volume, 2)
            )
            history.append(dto.model_dump())

            internal_price = raw_close
            current_time += time_jump

        self.x_prev = local_x
        return history