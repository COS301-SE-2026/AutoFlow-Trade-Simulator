import time

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
    
    def generate_number(self):
        self.x_prev = (self.a * self.x_prev + self.c) % self.m

        return self.x_prev

    def generate_float(self):
        return self.generate_number() / self.m

    def generate_currency(self, min_price=1.0, max_price=1000000.0):
        raw_price = min_price + (self.generate_float() * (max_price - min_price))

        return round(raw_price, 2)

lcg = LCGPseudoRandomGenerator()

print(lcg.generate_currency())