import argparse
import re
import subprocess
import sys
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path


def sql_str(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def parse_report(path: str, price_divisor: float):
    ...


def build_sql(reports, exchange: str, currency: str, asset_class: str, chunk_size: int) -> str:
    lines = ["BEGIN;", ""]

    seen_symbols = set()
    for ticker, _name, _rows in reports:
        if ticker in seen_symbols:
            continue
        seen_symbols.add(ticker)
        lines.append(
            "INSERT INTO asset (symbol, asset_class, exchange, currency)\n"
            f"VALUES ({sql_str(ticker)}, {sql_str(asset_class)}, {sql_str(exchange)}, {sql_str(currency)})\n"
            "ON CONFLICT (symbol) DO NOTHING;"
        )
        lines.append("")

    for ticker, name, rows in reports:
        if not rows:
            lines.append(f"-- {name} ({ticker}): no rows parsed, nothing to insert")
            lines.append("")
            continue

        lines.append(f"-- {name} ({ticker}): {len(rows)} row(s)")

        value_tuples = [
            "((SELECT asset_id FROM asset WHERE symbol = {sym}), {ts}, {o}, {h}, {l}, {c}, {v})".format(
                sym=sql_str(ticker),
                ts=sql_str(row["timestamp"].strftime("%Y-%m-%d %H:%M:%S")),
                o=row["open"],
                h=row["high"],
                l=row["low"],
                c=row["close"],
                v=row["volume"],
            )
            for row in rows
        ]

        for i in range(0, len(value_tuples), chunk_size):
            chunk = value_tuples[i: i + chunk_size]
            lines.append(
                "INSERT INTO dailyohlcv (asset_id, timestamp, open, high, low, close, volume)\n"
                "VALUES\n    " + ",\n    ".join(chunk) + "\n"
                "ON CONFLICT (asset_id, timestamp) DO UPDATE SET\n"
                "    open = EXCLUDED.open,\n"
                "    high = EXCLUDED.high,\n"
                "    low = EXCLUDED.low,\n"
                "    close = EXCLUDED.close,\n"
                "    volume = EXCLUDED.volume;"
            )
            lines.append("")

    lines.append("COMMIT;")
    return "\n".join(lines)


def main():
    ...