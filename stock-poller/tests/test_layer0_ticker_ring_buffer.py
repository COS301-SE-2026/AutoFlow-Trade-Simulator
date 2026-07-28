"""
Layer 0 — TickerRingBuffer is the other foundation piece: every adapter's
get_symbol_batch() depends on its rotation being correct and safe under
concurrent access.
"""
import asyncio

import pytest

from base_adapter import TickerRingBuffer

pytestmark = pytest.mark.layer0


class TestTickerRingBuffer:
    async def test_empty_buffer_returns_empty_batch(self):
        buf = TickerRingBuffer([])
        assert await buf.dequeue_batch(5) == []

    async def test_batch_smaller_than_pool_returns_requested_slice(self):
        buf = TickerRingBuffer(["A", "B", "C", "D"])
        assert await buf.dequeue_batch(2) == ["A", "B"]

    async def test_batch_larger_than_pool_clamped_to_pool_size(self):
        buf = TickerRingBuffer(["A", "B"])
        assert await buf.dequeue_batch(10) == ["A", "B"]

    async def test_rotation_continues_across_calls(self):
        buf = TickerRingBuffer(["A", "B", "C"])
        assert await buf.dequeue_batch(2) == ["A", "B"]
        assert await buf.dequeue_batch(2) == ["C", "A"]
        assert await buf.dequeue_batch(2) == ["B", "C"]

    async def test_wraps_correctly_when_batch_equals_pool_size(self):
        buf = TickerRingBuffer(["A", "B", "C"])
        assert await buf.dequeue_batch(3) == ["A", "B", "C"]
        assert await buf.dequeue_batch(3) == ["A", "B", "C"]

    async def test_concurrent_dequeues_never_duplicate_or_drop_within_one_cycle(self):
        # 6 tickers, 3 concurrent workers each grabbing batches of 2 ->
        # across one full cycle every ticker should appear exactly once.
        buf = TickerRingBuffer(["A", "B", "C", "D", "E", "F"])
        results = await asyncio.gather(*(buf.dequeue_batch(2) for _ in range(3)))
        flattened = sorted(sym for batch in results for sym in batch)
        assert flattened == ["A", "B", "C", "D", "E", "F"]
