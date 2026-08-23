from pathlib import Path
import pytest
import sys
from io import StringIO
from iress_report_to_sql import sql_str, build_sql, parse_report

def test_sql_str_plain_value():
    assert sql_str("SELECT * FROM iress_report_to_sql") == "SELECT * FROM iress_report_to_sql"

def test_sql_str_escapes_single_quote():
    assert sql_str("SELECT * FROM iress_report_to_sql WHERE a_field='test'") == 'SELECT * FROM iress_report_to_sql WHERE a_field=''test'''

def test_build_sql_generates_asset_and_dailyohlcv_inserts():
    reports = [
        ("AAPL", "Apple Inc.", [
            {"timestamp": "2025-01-01 00:00:00", "open": 150.0, "high": 155.0, "low": 149.0, "close": 153.0,
             "volume": 1000}
        ])
    ]
    sql = build_sql(reports, exchange="NASDAQ", currency="USD", asset_class="stocks", chunk_size=500)
    assert "INSERT INTO asset (symbol, asset_class, exchange, currency)" in sql
    assert "VALUES ('AAPL', 'stocks', 'NASDAQ', 'USD')" in sql
    assert "INSERT INTO dailyohlcv (asset_id, timestamp, open, high, low, close, volume)" in sql
    assert "VALUES" in sql
    assert "ON CONFLICT (asset_id, timestamp) DO UPDATE SET" in sql

def test_build_sql_deduplicates_asset_insert_per_ticker():
    reports = [
        ("AAPL", "Apple Inc.", []),
        ("AAPL", "Apple Inc.", [])
    ]
    sql = build_sql(reports, exchange="NASDAQ", currency="USD", asset_class="stocks", chunk_size=500)
    assert sql.count("INSERT INTO asset") == 1
    assert sql.count("VALUES ('AAPL'") == 1

def test_build_sql_chunks_rows_correctly():
    rows = [
        {"timestamp": f"2025-01-{i:02d} 00:00:00", "open": 100, "high": 101, "low": 99, "close": 100, "volume": 1000}
        for i in range(1, 150)]
    reports = [("AAPL", "Apple Inc.", rows)]
    sql = build_sql(reports, exchange="NASDAQ", currency="USD", asset_class="stocks", chunk_size=50)
    insert_blocks = sql.split("INSERT INTO dailyohlcv")
    for block in insert_blocks[1:]:
        lines = block.strip().split("\n")
        tuples = [line for line in lines if line.strip().startswith("((") or line.strip().startswith("(SELECT")]
        assert len(tuples) <= 50

def test_parse_report_extracts_ticker_and_rows():
    ...


def test_parse_report_missing_ticker_raises():
    ...

def test_parse_report_missing_table_raises():
    ...

def test_parse_report_skips_malformed_rows(capsys):
    ...