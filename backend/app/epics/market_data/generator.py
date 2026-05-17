import time
from datetime import datetime, timedelta


#This is the random number generator for money
class LCGPseudoRandomGenerator:

    def __init__(self, a=1103515245, c=12345, m=2**31, seed=None):
        self.a = a
        self.c = c
        self.m = m
        self.x0 = seed

        if seed is None:
            self.x0 = int(time.time() * 1000) % self.m

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

        #calculate the seconds inbetween the dates and use that to generate the data
        date_seconds = (end_date - start_date).total_seconds()

        random_seconds = self.generate_float() * date_seconds

        random_date = start_date + timedelta(seconds=random_seconds)

        return random_date.isoformat()
    

lcg = LCGPseudoRandomGenerator()

print(lcg.generate_currency())

symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "DOT/USDT"]
intervals = ["1m", "5m", "15m", "1h", "1d"]
timestamps = [datetime.now().isoformat() for _ in range(5)]

print(lcg.choice(symbols))
print(lcg.choice(intervals))
print(lcg.choice(timestamps))

test_seeds = [42, 0, 2147483647, 12345]

for s in test_seeds:
    test_lcg = LCGPseudoRandomGenerator(seed=s)
    print(f"--- Testing Seed: {s} ---")
    print(f"First Symbol: {test_lcg.choice(symbols)}")
    print(f"First Price:  ${test_lcg.generate_currency(30000, 60000)}")
    print("")

start = datetime(2026, 5, 1, 0, 0, 0)   # May 1st, 2026 at Midnight
end = datetime(2026, 5, 7, 23, 59, 59)  # May 7th, 2026 at 11:59 PM

lcg = LCGPseudoRandomGenerator(101)

print("Generating random timestamps within the date range:")
for i in range(3):
    random_timestamp = lcg.generate_datetime(start, end)
    print(f"Generated Time {i+1}: {random_timestamp}")