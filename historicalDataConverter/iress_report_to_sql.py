import argparse
import re
import subprocess
import sys
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path

TICKER_RE = re.compile(r"<B>([^<()]+?)\(([A-Z0-9.\-]+)\)\s*</B>", re.IGNORECASE)

REQUIRED_HEADER = ["Date", "High", "Low", "Open", "Close", "Volume"]

def sql_str(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def _safe_path(path_str: str) -> Path:
    base = Path.cwd().resolve()
    raw_path = Path(path_str)
    candidate = raw_path.resolve() if raw_path.is_absolute() else (base / raw_path).resolve()

    if not candidate.is_relative_to(base):
        raise ValueError(f"Refusing to access path outside the working directory: {path_str}")

    return candidate


def parse_report(path: str, price_divisor: float):
    safe_path = _safe_path(path)
    raw = safe_path.read_text(encoding="utf-8", errors="ignore")

    m = TICKER_RE.search(raw)
    if not m:
        raise ValueError(
            f"{path}: could not find a '<Name> (<TICKER>)' header — "
            "is this really an Iress price data report?"
        )
    company_name, ticker = m.group(1).strip(), m.group(2).strip().upper()

    soup = BeautifulSoup(raw, "lxml")
    table = soup.find("table", id="tblSharesAndIndices")
    if table is None:
        raise ValueError(f"{path}: could not find the price table (tblSharesAndIndices)")

    rows = table.find_all("tr")

    header_idx = None
    for i, r in enumerate(rows):
        cells = [c.get_text(strip=True) for c in r.find_all("td")]
        if cells[: len(REQUIRED_HEADER)] == REQUIRED_HEADER:
            header_idx = i
            break
    if header_idx is None:
        raise ValueError(f"{path}: could not locate the Date/High/Low/Open/Close/Volume header row")

    out_rows = []
    skipped = 0
    for r in rows[header_idx + 1:]:
        cells = [c.get_text(strip=True) for c in r.find_all("td")]
        if len(cells) < 6 or not cells[0]:
            continue

        date_str, high, low, open_, close, volume = cells[:6]

        try:
            ts = datetime.strptime(date_str, "%d %b %Y")
        except ValueError:
            skipped += 1
            continue

        try:
            out_rows.append(
                {
                    "timestamp": ts,
                    "open": float(open_) / price_divisor,
                    "high": float(high) / price_divisor,
                    "low": float(low) / price_divisor,
                    "close": float(close) / price_divisor,
                    "volume": float(volume),
                }
            )
        except ValueError:
            skipped += 1
            continue

    if skipped:
        print(f"{path}: skipped {skipped} malformed row(s)", file=sys.stderr)

    return ticker, company_name, out_rows


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
    ap = argparse.ArgumentParser(
        description="Convert Iress price-data report .xls exports into a SQL insert script.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("files", nargs="+", help="One or more Iress report .xls files")
    ap.add_argument("-o", "--output", default="insert_price_history.sql", help="Output .sql path")
    ap.add_argument("--exchange", default="JSE", help="Exchange tag for new assets (default: JSE)")
    ap.add_argument("--currency", default="ZAR", help="Currency tag for new assets (default: ZAR)")
    ap.add_argument("--asset-class", default="stocks", help="Asset class tag for new assets (default: stocks)")
    # JSE reports store price * 100 (cents), so we divide by 100 to get Rand.
    ap.add_argument(
        "--price-divisor",
        type=float,
        default=100.0,
        help="Divide raw High/Low/Open/Close by this (default: 100, JSE cents convention). Use 1 to disable.",
    )
    ap.add_argument("--chunk-size", type=int, default=500, help="Rows per multi-row INSERT (default: 500)")
    args = ap.parse_args()

    reports = []
    for f in args.files:
        ticker, name, rows = parse_report(f, args.price_divisor)
        print(f"Parsed {f}: {name} ({ticker}) -> {len(rows)} row(s)", file=sys.stderr)
        reports.append((ticker, name, rows))

    sql = build_sql(reports, args.exchange, args.currency, args.asset_class, args.chunk_size)
    output_path = _safe_path(args.output)
    output_path.write_text(sql, encoding="utf-8")
    print(f"Wrote {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()