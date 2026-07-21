import os
import asyncio
import logging
import asyncpg
from datetime import timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# toggle between database and local flat file storage
DB_MODE = os.getenv("DB_MODE", "false").lower() == "true"

def _naive_utc(ts):
    if ts.tzinfo is not None:
        return ts.astimezone(timezone.utc).replace(tzinfo=None)
    return ts

async def init_pool(db_config: dict) -> asyncpg.Pool:
    pool = await asyncpg.create_pool(
        host=os.environ["DB_HOST"],
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        min_size=db_config.get("pool_min_size", 2),
        max_size=db_config.get("pool_max_size", 8),
        command_timeout=db_config.get("command_timeout", 10),
    )
    logging.info("DB pool initialized.")
    return pool


class AssetCache:
    """
    Lazily-populated symbol -> asset_id cache.
    Poller assumes nothing is pre-seeded. The first tick for any symbol
    triggers a lookup-or-insert in the `asset` table, then the
    result is cached in-memory for every subsequent tick.
    """

    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        self._cache: dict[str, int] = {}
        self._lock = asyncio.Lock()

    async def get_or_create_asset_id(
            self, symbol: str, asset_class: str, exchange: str, currency: str
    ) -> int:
        if symbol in self._cache:
            return self._cache[symbol]

        async with self._lock:
            # re-check after acquiring lock, another coroutine may have won the race
            if symbol in self._cache:
                return self._cache[symbol]

            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT asset_id FROM asset WHERE symbol = $1", symbol
                )
                if row is None:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO asset (symbol, asset_class, exchange, currency)
                        VALUES ($1, $2, $3, $4)
                            ON CONFLICT (symbol) DO UPDATE SET symbol = EXCLUDED.symbol
                                                        RETURNING asset_id
                        """,
                        symbol,
                        asset_class,
                        exchange,
                        currency,
                    )

            self._cache[symbol] = row["asset_id"]
            return row["asset_id"]


async def upsert_realtime_ticks(pool: asyncpg.Pool, rows: list[dict]):
    if not rows:
        return
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO realtimeticks (asset_id, timestamp, price, volume)
            VALUES ($1, $2, $3, $4)
                ON CONFLICT (asset_id, timestamp) DO UPDATE
                                                         SET price = EXCLUDED.price, volume = EXCLUDED.volume
            """,
            [(r["asset_id"], _naive_utc(r["timestamp"]), r["price"], r["volume"]) for r in rows],
        )


async def upsert_daily_ohlcv(pool: asyncpg.Pool, rows: list[dict]):
    if not rows:
        return
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO dailyohlcv (asset_id, timestamp, open, high, low, close, volume)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (asset_id, timestamp) DO UPDATE
                                                         SET open = EXCLUDED.open,
                                                         high = EXCLUDED.high,
                                                         low = EXCLUDED.low,
                                                         close = EXCLUDED.close,
                                                         volume = EXCLUDED.volume
            """,
            [
                (
                    r["asset_id"],
                    _naive_utc(r["timestamp"]),
                    r["open"],
                    r["high"],
                    r["low"],
                    r["close"],
                    r["volume"],
                )
                for r in rows
            ],
        )

async def upsert_options(pool: asyncpg.Pool, rows: list[dict]):
    if not rows:
        return
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO options (contract_symbol, timestamp, asset_id, option_type, strike_price, expr_date, bid, ask, last_price, volume, open_interest, imp_vol, in_the_money)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (contract_symbol, timestamp) DO NOTHING
            """,
            [
                (
                    r["contract_symbol"],
                    _naive_utc(r["timestamp"]),
                    r["asset_id"],
                    r["option_type"],
                    r["strike_price"],
                    r["expr_date"],
                    r["bid"],
                    r["ask"],
                    r["last_price"],
                    r["volume"],
                    r["open_interest"],
                    r["imp_vol"],
                    r["in_the_money"],
                )
                for r in rows
            ],
        )