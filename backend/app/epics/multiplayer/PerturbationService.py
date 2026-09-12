from decimal import Decimal
from typing import List

from ...models.daily_OHLCV import DailyOHLCV
from ..market_data.generator import LCGPseudoRandomGenerator

JITTER_PCT = Decimal("0.004")


def derive_seed(match_id: int, player_one_id: int, player_two_id: int) -> int:
    return match_id * 1_000_003 + player_one_id + player_two_id


def perturb_bars(bars: List[DailyOHLCV], seed: int) -> List[DailyOHLCV]:
    rng = LCGPseudoRandomGenerator(seed=seed)

    def jitter(value: Decimal) -> Decimal:
        offset = (Decimal(str(rng.generate_float())) * 2 - 1) * JITTER_PCT
        return (value * (1 + offset)).quantize(Decimal("0.0001"))

    out: List[DailyOHLCV] = []
    for bar in bars:
        o, h, l, c = jitter(bar.open), jitter(bar.high), jitter(bar.low), jitter(bar.close)
        out.append(DailyOHLCV(
            asset_id=bar.asset_id,
            timestamp=bar.timestamp,
            open=o,
            high=max(o, h, l, c),
            low=min(o, h, l, c),
            close=c,
            volume=bar.volume,
        ))
    return out
