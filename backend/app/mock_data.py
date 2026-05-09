from random import Random


def generate_price_series(seed: int = 7, count: int = 5) -> list[float]:
    random = Random(seed)
    base_price = 100.0
    prices: list[float] = []

    for _ in range(count):
        base_price += random.uniform(-3.5, 3.5)
        prices.append(round(base_price, 2))

    return prices
