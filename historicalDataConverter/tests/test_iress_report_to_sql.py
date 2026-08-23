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
    report_path = "fixtures/valid_report.xls"
    ticker, name, rows = parse_report(str(report_path), price_divisor=100.0)
    assert ticker == "ABG"
    assert name == "ABSA GROUP LTD"
    assert len(rows) > 0
    first = rows[0]
    assert first["timestamp"].strftime("%Y-%m-%d") == "2026-07-30"
    assert first["high"] == 226.76
    assert first["low"] == 220.36
    assert first["open"] == 224.55
    assert first["close"] == 225.46
    assert first["volume"] == 1693205.0


def test_parse_report_missing_ticker_raises():
    report_path = "fixtures/missing_ticker.xls"
    report = str(report_path)
    with pytest.raises(ValueError) as e: parse_report(report, price_divisor=100.0)
    assert "could not find a '<Name> (<TICKER>)' header" in str(e.value)

def test_parse_report_missing_table_raises():
    report_path = "missing_table.xls"
    report = str(report_path)
    with pytest.raises(ValueError) as e: parse_report(report, price_divisor=100.0)
    assert "could not find the price table (tblSharesAndIndices)" in str(e.value)

def test_parse_report_skips_malformed_rows(captured):
    report_path = "fixtures/malformed_rows.xls"
    ticker, name, rows = parse_report(str(report_path), price_divisor=100.0)
    captured = capsys.readouterr()
    assert "skipped" in captured.err
    assert len(rows) > 0
    assert rows[0]["timestamp"].strftime("%Y-%m-%d") == "2026-07-30"
    # The second row is invalid
    # the third row on 28 Jul 2026 is valid
    assert rows[1]["timestamp"].strftime("%Y-%m-%d") == "2026-07-28"