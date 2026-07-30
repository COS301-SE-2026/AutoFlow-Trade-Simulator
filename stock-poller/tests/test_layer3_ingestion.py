"""
Layer 3 — IngestWorker sits above BaseMarketDataAdapter: it drains the
fast/slow asyncio.Queues that layer 2 pushes (table, row) tuples into, and
flushes them via db.upsert_*. We mock those upsert_* calls (that's layer 4's
job to verify) and focus purely on lane draining semantics: volume triggers,
temporal triggers, and fast-lane right-of-way.
"""
import asyncio

import pytest

from ingestion import IngestWorker, build_lanes

pytestmark = pytest.mark.layer3


def make_ingestion_config(fast_volume=3, fast_seconds=1.0, slow_volume=5, slow_seconds=1.0):
    return {
        "fast_lane": {"queue_maxsize": 100, "volume_trigger": fast_volume, "temporal_trigger_seconds": fast_seconds},
        "slow_lane": {"queue_maxsize": 100, "volume_trigger": slow_volume, "temporal_trigger_seconds": slow_seconds},
    }


class TestBuildLanes:
    def test_returns_two_queues_with_configured_maxsize(self):
        cfg = make_ingestion_config()
        cfg["fast_lane"]["queue_maxsize"] = 10
        cfg["slow_lane"]["queue_maxsize"] = 20
        fast_q, slow_q = build_lanes(cfg)
        assert fast_q.maxsize == 10
        assert slow_q.maxsize == 20


class TestDrainLane:
    async def test_empty_queue_times_out_and_returns_empty_buffer(self):
        cfg = make_ingestion_config()
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        buffer = await worker._drain_lane(fast_q, volume_trigger=3, temporal_trigger_seconds=0.05)
        assert buffer == {"realtimeticks": [], "dailyohlcv": [], "options": []}

    async def test_volume_trigger_stops_drain_early(self):
        cfg = make_ingestion_config()
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        for i in range(5):
            await fast_q.put(("realtimeticks", {"n": i}))

        buffer = await worker._drain_lane(fast_q, volume_trigger=3, temporal_trigger_seconds=5.0)
        assert len(buffer["realtimeticks"]) == 3
        # remaining 2 items should still be on the queue for the next drain
        assert fast_q.qsize() == 2

    async def test_temporal_trigger_stops_drain_even_if_volume_not_met(self):
        cfg = make_ingestion_config()
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        await fast_q.put(("realtimeticks", {"n": 1}))
        buffer = await worker._drain_lane(fast_q, volume_trigger=100, temporal_trigger_seconds=0.05)
        assert len(buffer["realtimeticks"]) == 1

    async def test_items_sorted_into_correct_table_buckets(self):
        cfg = make_ingestion_config()
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        await fast_q.put(("realtimeticks", {"a": 1}))
        await fast_q.put(("dailyohlcv", {"b": 2}))
        await fast_q.put(("options", {"c": 3}))

        buffer = await worker._drain_lane(fast_q, volume_trigger=3, temporal_trigger_seconds=1.0)
        assert buffer["realtimeticks"] == [{"a": 1}]
        assert buffer["dailyohlcv"] == [{"b": 2}]
        assert buffer["options"] == [{"c": 3}]


class TestFlush:
    async def test_flush_calls_all_three_upsert_functions(self, monkeypatch):
        calls = []

        async def fake_upsert_ticks(pool, rows):
            calls.append(("ticks", rows))

        async def fake_upsert_ohlcv(pool, rows):
            calls.append(("ohlcv", rows))

        async def fake_upsert_options(pool, rows):
            calls.append(("options", rows))

        import ingestion
        monkeypatch.setattr(ingestion, "upsert_realtime_ticks", fake_upsert_ticks)
        monkeypatch.setattr(ingestion, "upsert_daily_ohlcv", fake_upsert_ohlcv)
        monkeypatch.setattr(ingestion, "upsert_options", fake_upsert_options)

        cfg = make_ingestion_config()
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool="fake-pool", fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        buffer = {"realtimeticks": [{"a": 1}], "dailyohlcv": [], "options": []}
        await worker._flush(buffer)

        assert ("ticks", [{"a": 1}]) in calls
        assert ("ohlcv", []) in calls
        assert ("options", []) in calls


class TestRunLoopFastLanePriority:
    async def test_fast_lane_flushed_before_slow_lane_is_touched(self, monkeypatch):
        flush_order = []

        cfg = make_ingestion_config(fast_volume=1, fast_seconds=0.05, slow_volume=1, slow_seconds=0.05)
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        async def fake_flush(buffer):
            if buffer["realtimeticks"]:
                flush_order.append("fast")
            elif buffer["dailyohlcv"] or buffer["options"]:
                flush_order.append("slow")

        monkeypatch.setattr(worker, "_flush", fake_flush)

        await slow_q.put(("dailyohlcv", {"slow": True}))
        await fast_q.put(("realtimeticks", {"fast": True}))

        task = asyncio.create_task(worker.run())
        await asyncio.sleep(0.2)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert flush_order[0] == "fast"
        assert "slow" in flush_order

    async def test_loop_sleeps_instead_of_busy_looping_when_both_lanes_empty(self, monkeypatch):
        cfg = make_ingestion_config(fast_seconds=0.02, slow_seconds=0.02)
        fast_q, slow_q = build_lanes(cfg)
        worker = IngestWorker(pool=None, fast_queue=fast_q, slow_queue=slow_q, ingestion_config=cfg)

        sleep_calls = []
        real_sleep = asyncio.sleep

        async def counting_sleep(seconds):
            if seconds == 0.25:
                sleep_calls.append(seconds)
            await real_sleep(0)  # don't actually wait 0.25s in the test

        monkeypatch.setattr(asyncio, "sleep", counting_sleep)

        task = asyncio.create_task(worker.run())
        await real_sleep(0.1)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert len(sleep_calls) >= 1
