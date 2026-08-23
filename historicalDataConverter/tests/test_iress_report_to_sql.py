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
    ...

def test_build_sql_deduplicates_asset_insert_per_ticker():
    ...

def test_build_sql_chunks_rows_correctly():
    ...

def test_parse_report_extracts_ticker_and_rows():
    ...


def test_parse_report_missing_ticker_raises():
    ...

def test_parse_report_missing_table_raises():
    ...

def test_parse_report_skips_malformed_rows(capsys):
    ...