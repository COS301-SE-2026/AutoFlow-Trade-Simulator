from pathlib import Path
import pytest
from datetime import datetime, timedelta
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from iress_report_to_sql import sql_str, build_sql, parse_report

FIXTURES = Path(__file__).parent / "fixtures"

def test_sql_str_plain_value():
    assert sql_str("SELECT * FROM iress_report_to_sql") == "'SELECT * FROM iress_report_to_sql'"

def test_sql_str_escapes_single_quote():
    expected = "'SELECT * FROM iress_report_to_sql WHERE a_field=''test'''"
    assert sql_str("SELECT * FROM iress_report_to_sql WHERE a_field='test'") == expected

def test_build_sql_generates_asset_and_dailyohlcv_inserts():
    dt = datetime(2025, 1, 1, 0, 0, 0)
    reports = [
        ("AAPL", "Apple Inc.", [
            {"timestamp": dt, "open": 150.0, "high": 155.0, "low": 149.0, "close": 153.0, "volume": 1000}
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
        {"timestamp": datetime(2025, 1, 1) + timedelta(days=i),
         "open": 100, "high": 101, "low": 99, "close": 100, "volume": 1000}
        for i in range(1, 150)
    ]
    reports = [("AAPL", "Apple Inc.", rows)]
    sql = build_sql(reports, exchange="NASDAQ", currency="USD", asset_class="stocks", chunk_size=50)
    insert_blocks = sql.split("INSERT INTO dailyohlcv")
    for block in insert_blocks[1:]:
        lines = block.strip().split("\n")
        tuples = [line for line in lines if line.strip().startswith("(SELECT") or line.strip().startswith("((")]
        assert len(tuples) <= 50

def test_parse_report_extracts_ticker_and_rows():
    report_path = FIXTURES / "valid_report.xls"
    ticker, name, rows = parse_report(str(report_path), price_divisor=100.0)
    assert ticker == "ABG"
    assert name == "ABSA GROUP LTD"
    assert len(rows) > 0
    first = rows[0]
    assert first["timestamp"].strftime("%Y-%m-%d") == "2026-08-21"
    assert first["high"] == 227.77
    assert first["low"] == 224.22
    assert first["open"] == 224.22
    assert first["close"] == 227.00
    assert first["volume"] == 3644523.0


def test_parse_report_missing_ticker_raises():
    report_path = FIXTURES / "missing_ticker.xls"
    report = str(report_path)
    with pytest.raises(ValueError) as e: parse_report(report, price_divisor=100.0)
    assert "could not find a '<Name> (<TICKER>)' header" in str(e.value)

def test_parse_report_missing_table_raises():
    report_path = FIXTURES / "missing_table.xls"
    report = str(report_path)
    with pytest.raises(ValueError) as e: parse_report(report, price_divisor=100.0)
    assert "could not find the price table (tblSharesAndIndices)" in str(e.value)

def test_parse_report_skips_malformed_rows(capsys):
    report_path = FIXTURES / "malformed_rows.xls"
    ticker, name, rows = parse_report(str(report_path), price_divisor=100.0)
    captured = capsys.readouterr()
    assert "skipped" in captured.err
    assert len(rows) > 0
    assert rows[0]["timestamp"].strftime("%Y-%m-%d") == "2026-08-21"
    # so rows[1] should be the 19 Aug row
    assert rows[1]["timestamp"].strftime("%Y-%m-%d") == "2026-08-19"