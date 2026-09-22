"""
AutoFlow Trade Simulator — database seeder.

Idempotent: safe to re-run. Natural-key upserts wherever a unique constraint
exists; existence checks where it doesn't.

Run with:  python -m seeds       (from backend/)
or via:    npm run db:seed       (from project root)
"""

import json
from datetime import datetime, date, timedelta
from decimal import Decimal

from sqlalchemy import text
from sqlmodel import Session, select

from app.database import engine
from app.core.security import create_password_hash

# --- model classes (names match app/models/__init__.py) -------------------
from app.models import (
    User,
    Currency,
    Asset,
    StockAsset,
    Portfolio,
    InternationalAccount,
    Transaction,
    Report,
    ReportSection,
    Scenario,
    News,
    MarketCondition,
    QTEQuestion,
    TechTree,
    PracticeSimulation,
    BackTestResults,
    ProgressionGrant,
    Greeks,
    MultiplayerMatch,
    MultiplayerParticipant,
    MatchEventLog,
    Strategies,
)

# --- enums (NOT re-exported from app.models; import from their modules) ---
from app.models.transaction import Direction
from app.models.report import Period
from app.models.market_condition import Condition
from app.models.news import NewsCategory
from app.models.progression_grant import ProgressionSource
from app.models.multiplayer_match import MatchStatus, QuestionType


# ---------------------------------------------------------------------------
# 1. CURRENCIES
# ---------------------------------------------------------------------------
currency_data = [
    {"code": "USD", "name": "US Dollar"},
    {"code": "EUR", "name": "Euro"},
    {"code": "GBP", "name": "British Pound"},
    {"code": "JPY", "name": "Japanese Yen"},
    {"code": "ZAR", "name": "South African Rand"},
    {"code": "AUD", "name": "Australian Dollar"},
    {"code": "CAD", "name": "Canadian Dollar"},
    {"code": "CHF", "name": "Swiss Franc"},
    {"code": "CNY", "name": "Chinese Yuan"},
    {"code": "INR", "name": "Indian Rupee"},
]


# ---------------------------------------------------------------------------
# 2. ASSETS
# ---------------------------------------------------------------------------
asset_data = [
    {"symbol": "AAPL",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "GOOGL",    "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "MSFT",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "TSLA",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "AMZN",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "NVDA",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "META",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "NFLX",     "asset_class": "STOCK",  "exchange": "NASDAQ",  "currency": "USD"},
    {"symbol": "BTC/USDT", "asset_class": "CRYPTO", "exchange": "BINANCE", "currency": "USD"},
    {"symbol": "ETH/USDT", "asset_class": "CRYPTO", "exchange": "BINANCE", "currency": "USD"},
    {"symbol": "SOL/USDT", "asset_class": "CRYPTO", "exchange": "BINANCE", "currency": "USD"},
    {"symbol": "DOT/USDT", "asset_class": "CRYPTO", "exchange": "BINANCE", "currency": "USD"},
]

stock_symbols = [a["symbol"] for a in asset_data if a["asset_class"] == "STOCK"]


# ---------------------------------------------------------------------------
# 3. STRATEGIES
# ---------------------------------------------------------------------------
strategy_data = [
    {
        "name": "Buy and Hold",
        "description": "Purchase an asset and hold it long-term regardless of short-term market fluctuations.",
        "level": "Beginner",
        "category": "Passive",
        "steps": ["Choose a broad-market asset or index",
                  "Buy a position sized to your risk tolerance",
                  "Hold through volatility without selling",
                  "Review only on a long horizon"],
        "pros": ["Minimal effort and low fees",
                 "Historically strong long-term returns",
                 "Avoids timing-the-market mistakes"],
        "cons": ["Requires patience through deep drawdowns",
                 "No capital protection if the asset stagnates",
                 "Slow feedback for learning"],
    },
    {
        "name": "Dollar-Cost Averaging",
        "description": "Invest a fixed amount at regular intervals to smooth out entry prices over time.",
        "level": "Beginner",
        "category": "Passive",
        "steps": ["Pick a fixed investment amount",
                  "Choose a recurring interval (weekly/monthly)",
                  "Buy regardless of price",
                  "Track the average cost basis over time"],
        "pros": ["Reduces timing risk", "Builds discipline automatically",
                 "Works well in volatile markets"],
        "cons": ["Can underperform lump-sum in a strong uptrend",
                 "Many small trades increase fees",
                 "Requires consistency to be effective"],
    },
    {
        "name": "Trend Following",
        "description": "Enter positions in the direction of a confirmed trend and ride it until momentum reverses.",
        "level": "Beginner",
        "category": "Momentum",
        "steps": ["Identify a trend using moving averages",
                  "Enter on a breakout or pullback confirmation",
                  "Set a trailing stop to lock in gains",
                  "Exit when the trend structure breaks"],
        "pros": ["Simple to identify visually", "Captures large directional moves",
                 "Clear entry and exit rules"],
        "cons": ["Whipsaws in sideways markets", "Late entries near trend exhaustion",
                 "Multiple small losses in choppy conditions"],
    },
    {
        "name": "Moving Average Crossover",
        "description": "Buy when a fast moving average crosses above a slow one, and sell on the reverse cross.",
        "level": "Beginner",
        "category": "Technical",
        "steps": ["Choose a fast MA and a slow MA",
                  "Buy on golden cross (fast above slow)",
                  "Sell on death cross (fast below slow)",
                  "Optionally filter by trend or volume"],
        "pros": ["Fully mechanical and easy to backtest",
                 "Removes emotional decision-making",
                 "Works well in trending markets"],
        "cons": ["Lagging indicator — late signals",
                 "Frequent false crosses in ranging markets",
                 "Poor in low-volatility conditions"],
    },
    {
        "name": "Value Investing",
        "description": "Buy undervalued assets trading below their intrinsic worth and wait for the market to reprice them.",
        "level": "Intermediate",
        "category": "Fundamental",
        "steps": ["Analyse fundamentals (P/E, P/B, cash flow)",
                  "Estimate intrinsic value",
                  "Buy below intrinsic value with a margin of safety",
                  "Sell once mispricing corrects"],
        "pros": ["Backed by strong fundamental analysis",
                 "Margin of safety limits downside",
                 "Can produce outsized long-term returns"],
        "cons": ["Undervaluation can persist for years",
                 "Requires deep financial analysis skills",
                 "Value traps can destroy capital"],
    },
    {
        "name": "Breakout Trading",
        "description": "Enter when price breaks through a key support or resistance level with momentum.",
        "level": "Intermediate",
        "category": "Momentum",
        "steps": ["Identify a consolidation range or pattern",
                  "Wait for a close beyond resistance",
                  "Enter on the breakout with confirmation volume",
                  "Place a stop below the breakout level"],
        "pros": ["High reward-to-risk on strong moves",
                 "Clear invalidation level",
                 "Works across timeframes and assets"],
        "cons": ["False breakouts cause quick losses",
                 "Slippage on fast moves",
                 "Requires discipline to avoid chasing"],
    },
    {
        "name": "Range Trading",
        "description": "Buy near support and sell near resistance while price consolidates within a defined channel.",
        "level": "Intermediate",
        "category": "Technical",
        "steps": ["Identify a well-defined range",
                  "Buy near the lower boundary",
                  "Sell or short near the upper boundary",
                  "Exit if price closes outside the range"],
        "pros": ["High frequency of setups in sideways markets",
                 "Clear entry and exit levels",
                 "Short holding periods reduce overnight risk"],
        "cons": ["Range breaks cause significant losses",
                 "Requires constant monitoring",
                 "Fees accumulate from frequent trades"],
    },
    {
        "name": "Swing Trading",
        "description": "Hold positions for days to weeks to capture short-to-medium-term price swings.",
        "level": "Intermediate",
        "category": "Momentum",
        "steps": ["Scan for setups on daily/4-hour charts",
                  "Enter with a defined stop and target",
                  "Hold for the swing duration",
                  "Exit at target or on reversal signal"],
        "pros": ["Less screen time than day trading",
                 "Captures larger moves than intraday",
                 "Flexible across many markets"],
        "cons": ["Overnight and gap risk",
                 "Requires patience and discipline",
                 "Small sample size of trades"],
    },
    {
        "name": "Momentum Trading",
        "description": "Buy assets showing strong recent performance and sell those showing weakness, riding short-term momentum.",
        "level": "Intermediate",
        "category": "Momentum",
        "steps": ["Rank assets by recent returns",
                  "Buy the strongest performers",
                  "Avoid or short the weakest",
                  "Rebalance periodically and cut losers"],
        "pros": ["Momentum is a well-documented anomaly",
                 "Works across equities and crypto",
                 "Clear quantitative rules"],
        "cons": ["Sharp mean-reversion can erase gains",
                 "Crowded trades unwind violently",
                 "High turnover drives costs"],
    },
    {
        "name": "Mean Reversion",
        "description": "Bet that price will return to its historical average after an extreme deviation.",
        "level": "Advanced",
        "category": "Statistical",
        "steps": ["Measure deviation using z-score or Bollinger Bands",
                  "Enter when price is far from the mean",
                  "Target a return to the mean",
                  "Stop out if deviation extends further"],
        "pros": ["Statistically grounded",
                 "High win rate in ranging regimes",
                 "Works well on pairs and indices"],
        "cons": ["Catastrophic losses in trending regimes",
                 "Mean can shift over time",
                 "Requires strict risk management"],
    },
    {
        "name": "Pairs Trading",
        "description": "Trade two correlated assets against each other, buying the laggard and shorting the leader.",
        "level": "Advanced",
        "category": "Arbitrage",
        "steps": ["Find two historically correlated assets",
                  "Measure the spread and its z-score",
                  "Enter when the spread diverges",
                  "Exit when the spread reverts"],
        "pros": ["Market-neutral — insulated from broad moves",
                 "Statistical edge with clear rules",
                 "Attractive risk-adjusted returns"],
        "cons": ["Correlation can break down",
                 "Requires short-selling capability",
                 "Complex execution and monitoring"],
    },
    {
        "name": "Covered Call",
        "description": "Hold the underlying asset and sell a call option against it to generate income.",
        "level": "Advanced",
        "category": "Options",
        "steps": ["Own at least 100 shares of the underlying",
                  "Sell an out-of-the-money call",
                  "Collect the premium upfront",
                  "Repeat monthly or roll as needed"],
        "pros": ["Generates recurring income",
                 "Reduces effective cost basis",
                 "Profits in flat or mildly bullish markets"],
        "cons": ["Caps upside if the asset rallies hard",
                 "Still exposed to full downside",
                 "Requires options approval and capital"],
    },
]


# ---------------------------------------------------------------------------
# 4. USERS
# ---------------------------------------------------------------------------
user_data = [
    {"email": "alice@example.com",    "full_name": "Alice Smith",   "password": "Password0!"},
    {"email": "bob@example.com",      "full_name": "Bob Jones",     "password": "Password2!"},
    {"email": "charlie@example.com",  "full_name": "Charlie Brown", "password": "Password3!"},
    {"email": "diana@example.com",    "full_name": "Diana Prince",  "password": "Password4!"},
    {"email": "eve@example.com",      "full_name": "Eve Turner",    "password": "Password5!"},
    {"email": "testUser@example.com", "full_name": "Test User",     "password": "Password1!"},
]


# ---------------------------------------------------------------------------
# 5. SCENARIOS
# ---------------------------------------------------------------------------
scenario_data = [
    {"name": "AAPL Bull Run",
     "description": "A sustained uptrend in Apple stock.",
     "symbol": "AAPL",
     "start_date": date(2024, 1, 1), "end_date": date(2024, 6, 30),
     "active": True},
    {"name": "TSLA Crash",
     "description": "Sharp drawdown in Tesla stock.",
     "symbol": "TSLA",
     "start_date": date(2024, 3, 1), "end_date": date(2024, 4, 15),
     "active": True},
    {"name": "BTC Volatility",
     "description": "High-volatility Bitcoin trading window.",
     "symbol": "BTC/USDT",
     "start_date": date(2024, 2, 1), "end_date": date(2024, 5, 1),
     "active": False},
]


# ---------------------------------------------------------------------------
# 6. NEWS
# ---------------------------------------------------------------------------
news_data = [
    {"category": NewsCategory.RUMOR,
     "description": "Rumours of an Apple acquisition of a small AI startup.",
     "source": "MarketWire", "author": "Jane Doe",
     "full_story": "Anonymous sources suggest Apple is in early talks ...",
     "ticker": "AAPL", "days_ago": 1},
    {"category": NewsCategory.SENS,
     "description": "Tesla releases Q1 delivery numbers below guidance.",
     "source": "Reuters", "author": "John Smith",
     "full_story": "Tesla delivered fewer vehicles than analysts expected ...",
     "ticker": "TSLA", "days_ago": 2},
    {"category": NewsCategory.ARTICLE,
     "description": "Bitcoin rallies past key resistance level.",
     "source": "CoinDesk", "author": "Alex Chen",
     "full_story": "BTC broke above the 70k mark for the first time this quarter ...",
     "ticker": "BTC/USDT", "days_ago": 3},
]


# ---------------------------------------------------------------------------
# 7. MARKET CONDITIONS
# ---------------------------------------------------------------------------
market_condition_data = [
    {"days_ago": 5, "condition": Condition.BEAR},
    {"days_ago": 3, "condition": Condition.RANGING},
    {"days_ago": 1, "condition": Condition.BULL},
]


# ---------------------------------------------------------------------------
# 8. QTE QUESTIONS
# ---------------------------------------------------------------------------
qte_question_data = [
    {"question_type": QuestionType.jargon,
     "prompt": "What does 'liquidity' mean in a market?",
     "options": ["How easily an asset can be bought or sold without affecting its price",
                 "The total value of a portfolio",
                 "A measure of volatility"],
     "correct_answer": "How easily an asset can be bought or sold without affecting its price",
     "correct_cash_delta_pct": Decimal("0.0500"),
     "incorrect_cash_delta_pct": Decimal("-0.0200"),
     "active": True},
    {"question_type": QuestionType.scenario,
     "prompt": "A stock's RSI just hit 78. What is the most likely interpretation?",
     "options": ["Overbought", "Oversold", "Neutral"],
     "correct_answer": "Overbought",
     "correct_cash_delta_pct": Decimal("0.0300"),
     "incorrect_cash_delta_pct": Decimal("-0.0150"),
     "active": True},
    {"question_type": QuestionType.jargon,
     "prompt": "What is a 'stop-loss' order?",
     "options": ["An order to sell once a price threshold is reached",
                 "A limit order to buy below market",
                 "A dividend reinvestment plan"],
     "correct_answer": "An order to sell once a price threshold is reached",
     "correct_cash_delta_pct": Decimal("0.0400"),
     "incorrect_cash_delta_pct": Decimal("-0.0200"),
     "active": True},
]


# ---------------------------------------------------------------------------
# 9. TECH TREE
# ---------------------------------------------------------------------------
tech_tree_data = [
    {"name": "Market Basics",      "cost": 0,   "prerequisites": [],                     "unlocks": ["Order Types"]},
    {"name": "Order Types",        "cost": 100, "prerequisites": ["Market Basics"],      "unlocks": ["Risk Management"]},
    {"name": "Risk Management",    "cost": 250, "prerequisites": ["Order Types"],        "unlocks": ["Technical Analysis"]},
    {"name": "Technical Analysis", "cost": 400, "prerequisites": ["Risk Management"],    "unlocks": ["Options Trading"]},
    {"name": "Options Trading",    "cost": 800, "prerequisites": ["Technical Analysis"], "unlocks": []},
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_create(session, model, defaults=None, **filters):
    """Return (instance, created_bool). Looks up by the given filters."""
    stmt = select(model)
    for k, v in filters.items():
        stmt = stmt.where(getattr(model, k) == v)
    obj = session.exec(stmt).first()
    if obj:
        return obj, False
    params = dict(filters)
    if defaults:
        params.update(defaults)
    obj = model(**params)
    session.add(obj)
    session.flush()
    return obj, True


# ---------------------------------------------------------------------------
# Seeders
# ---------------------------------------------------------------------------
def _seed_currencies(session):
    added = 0
    for row in currency_data:
        _, created = _get_or_create(
            session, Currency, code=row["code"], defaults={"name": row["name"]}
        )
        added += created
    return added


def _seed_assets(session):
    added = 0
    for row in asset_data:
        _, created = _get_or_create(
            session, Asset, symbol=row["symbol"],
            defaults={
                "asset_class": row["asset_class"],
                "exchange": row["exchange"],
                "currency": row["currency"],
            },
        )
        added += created
    return added


def _seed_stock_assets(session):
    added = 0
    for sym in stock_symbols:
        asset = session.exec(select(Asset).where(Asset.symbol == sym)).first()
        if not asset:
            continue
        _, created = _get_or_create(session, StockAsset, asset_id=asset.asset_id)
        added += created
    return added


def _seed_strategies(session):
    added = 0
    for row in strategy_data:
        _, created = _get_or_create(
            session, Strategies, name=row["name"],
            defaults={k: row[k] for k in
                      ("description", "level", "category", "steps", "pros", "cons")},
        )
        added += created
    return added


def _seed_users(session):
    added = 0
    for row in user_data:
        _, created = _get_or_create(
            session, User, email=row["email"],
            defaults={
                "full_name": row["full_name"],
                "password_hash": create_password_hash(row["password"]),
            },
        )
        added += created
    return added


def _seed_scenarios(session):
    added = 0
    for row in scenario_data:
        _, created = _get_or_create(
            session, Scenario, name=row["name"],
            defaults={k: row[k] for k in
                      ("description", "symbol", "start_date", "end_date", "active")},
        )
        added += created
    return added


def _seed_news(session):
    added = 0
    for row in news_data:
        _, created = _get_or_create(
            session, News,
            ticker=row["ticker"], description=row["description"],
            defaults={
                "category": row["category"],
                "source": row["source"],
                "author": row["author"],
                "full_story": row["full_story"],
                "timestamp": datetime.utcnow() - timedelta(days=row["days_ago"]),
            },
        )
        added += created
    return added


def _seed_market_conditions(session):
    added = 0
    for row in market_condition_data:
        d = datetime.utcnow() - timedelta(days=row["days_ago"])
        _, created = _get_or_create(
            session, MarketCondition, date=d,
            defaults={"condition": row["condition"]},
        )
        added += created
    return added


def _seed_qte_questions(session):
    added = 0
    for row in qte_question_data:
        _, created = _get_or_create(
            session, QTEQuestion, prompt=row["prompt"],
            defaults={k: row[k] for k in
                      ("question_type", "options", "correct_answer",
                       "correct_cash_delta_pct", "incorrect_cash_delta_pct", "active")},
        )
        added += created
    return added


def _seed_tech_tree(session):
    """
    Two-pass insert:
      Pass 1 — insert every node with 'unlocks': [] so the trigger never sees
               a forward reference to a node that doesn't exist yet.
      Pass 2 — jsonb_set the 'unlocks' array now that all nodes are present.
    """
    inserted = 0

    # Pass 1 — insert nodes with empty unlocks
    for row in tech_tree_data:
        exists = session.exec(
            text("SELECT node_id FROM techtree WHERE node->>'name' = :n").bindparams(n=row["name"])
        ).first()
        if exists:
            continue
        node = {
            "name": row["name"],
            "cost": row["cost"],
            "prerequisites": row["prerequisites"],
            "unlocks": [],
        }
        session.add(TechTree(node=node))
        session.flush()
        inserted += 1

    # Pass 2 — patch unlocks
    for row in tech_tree_data:
        if not row["unlocks"]:
            continue
        session.exec(
            text("""
                UPDATE techtree
                SET node = jsonb_set(node, '{unlocks}', CAST(:unlocks AS jsonb))
                WHERE node->>'name' = :name
            """).bindparams(
                unlocks=json.dumps(row["unlocks"]),
                name=row["name"],
            )
        )
    session.flush()
    return inserted


def _seed_portfolios_and_accounts(session):
    p_added = a_added = 0
    usd = session.exec(select(Currency).where(Currency.code == "USD")).first()
    if not usd:
        raise RuntimeError("USD currency must be seeded before accounts")

    for user in session.exec(select(User)).all():
        portfolio, p_created = _get_or_create(
            session, Portfolio, user_id=user.id,
            defaults={
                "cash_balance": Decimal("100000"),
                "name": f"{user.full_name}'s Portfolio",
            },
        )
        p_added += p_created

        _, a_created = _get_or_create(
            session, InternationalAccount,
            portfolio_id=portfolio.id, currency_id=usd.id,
            defaults={
                "balance": Decimal("100000"),
                "created_at": datetime.utcnow(),
            },
        )
        a_added += a_created

    return p_added, a_added


def _seed_transactions(session):
    alice = session.exec(select(User).where(User.email == "alice@example.com")).first()
    if not alice:
        return 0
    portfolio = session.exec(select(Portfolio).where(Portfolio.user_id == alice.id)).first()
    if not portfolio:
        return 0
    account = session.exec(
        select(InternationalAccount).where(InternationalAccount.portfolio_id == portfolio.id)
    ).first()
    if not account:
        return 0

    if session.exec(select(Transaction).where(Transaction.account_id == account.id)).first():
        return 0

    trades = [
        ("AAPL",     Direction.Buy,  10,             Decimal("185.5000")),
        ("GOOGL",    Direction.Buy,  5,              Decimal("180.2500")),
        ("MSFT",     Direction.Sell, 2,              Decimal("425.0000")),
        ("TSLA",     Direction.Buy,  8,              Decimal("245.7500")),
        ("BTC/USDT", Direction.Buy,  Decimal("0.5"), Decimal("66000.0000")),
        ("ETH/USDT", Direction.Sell, Decimal("3"),   Decimal("3450.0000")),
    ]
    count = 0
    now = datetime.utcnow()
    for i, (sym, direction, qty, px) in enumerate(trades):
        asset = session.exec(select(Asset).where(Asset.symbol == sym)).first()
        if not asset:
            continue
        session.add(Transaction(
            account_id=account.id,
            asset_id=asset.asset_id,
            direction=direction,
            quantity=float(qty),
            price_at_execution=px,
            executed_at=now - timedelta(hours=len(trades) - i),
        ))
        count += 1
    session.flush()
    return count


def _seed_greeks(session):
    added = 0
    for user in session.exec(select(User)).all():
        _, created = _get_or_create(
            session, Greeks, user_id=user.id,
            defaults={
                "symbol": "AAPL",
                "delta": Decimal("0.5500"),
                "gamma": Decimal("0.0200"),
                "theta": Decimal("-0.0500"),
                "vega":  Decimal("0.1200"),
                "rho":   Decimal("0.0300"),
                "timestamp": datetime.utcnow(),
            },
        )
        added += created
    return added


def _seed_reports(session):
    """One report + a few sections per user."""
    report_added = 0
    section_added = 0

    section_rows = [
        {"ticker": "AAPL",     "open_price": Decimal("183.20"),  "close_price": Decimal("187.20"),
         "pct_change": 2.18, "period_high": Decimal("188.75"), "period_low": Decimal("182.10")},
        {"ticker": "GOOGL",    "open_price": Decimal("178.50"),  "close_price": Decimal("182.10"),
         "pct_change": 2.02, "period_high": Decimal("183.40"), "period_low": Decimal("177.80")},
        {"ticker": "MSFT",     "open_price": Decimal("420.50"),  "close_price": Decimal("429.75"),
         "pct_change": 2.20, "period_high": Decimal("431.50"), "period_low": Decimal("419.80")},
        {"ticker": "TSLA",     "open_price": Decimal("243.00"),  "close_price": Decimal("250.10"),
         "pct_change": 2.92, "period_high": Decimal("251.20"), "period_low": Decimal("242.10")},
        {"ticker": "BTC/USDT", "open_price": Decimal("65000.00"),"close_price": Decimal("68000.00"),
         "pct_change": 4.62, "period_high": Decimal("69000.00"),"period_low": Decimal("64000.00")},
        {"ticker": "ETH/USDT", "open_price": Decimal("3400.00"), "close_price": Decimal("3435.40"),
         "pct_change": 1.04, "period_high": Decimal("3520.00"), "period_low": Decimal("3315.20")},
    ]

    for user in session.exec(select(User)).all():
        report, created = _get_or_create(
            session, Report, user_id=user.id,
            defaults={
                "period": Period.Weekly,
                "generated_at": datetime.utcnow(),
            },
        )
        report_added += created

        for row in section_rows:
            _, s_created = _get_or_create(
                session, ReportSection,
                report_id=report.id, ticker=row["ticker"],
                defaults={
                    "open_price": row["open_price"],
                    "close_price": row["close_price"],
                    "pct_change": row["pct_change"],
                    "period_high": row["period_high"],
                    "period_low": row["period_low"],
                },
            )
            section_added += s_created
    return report_added, section_added


def _seed_practice_simulation(session):
    alice = session.exec(select(User).where(User.email == "alice@example.com")).first()
    if not alice:
        return 0
    if session.exec(
        select(PracticeSimulation).where(PracticeSimulation.user_id == alice.id)
    ).first():
        return 0

    now = datetime.utcnow()
    sim = PracticeSimulation(
        user_id=alice.id,
        symbols=["AAPL", "MSFT"],
        start_date=date(2024, 1, 1),
        end_date=date(2024, 3, 1),
        initial_balance=Decimal("10000"),
        current_balance=Decimal("10450"),
        positions={"AAPL": 30, "MSFT": 5},
        allocations={"AAPL": 0.6, "MSFT": 0.4},
        summary={"returns_pct": 4.5, "trades_count": 6},
        status="completed",
        created_at=now - timedelta(days=30),
        finished_at=now - timedelta(days=1),
        last_prices={"AAPL": 192.30, "MSFT": 430.10},
        actions=[],
    )
    session.add(sim)
    session.flush()
    return 1


def _seed_backtest_results(session):
    alice = session.exec(select(User).where(User.email == "alice@example.com")).first()
    if not alice:
        return 0
    sim = session.exec(
        select(PracticeSimulation).where(PracticeSimulation.user_id == alice.id)
    ).first()
    if not sim:
        return 0
    _, created = _get_or_create(
        session, BackTestResults, simu_id=sim.id, user_id=alice.id,
        defaults={
            "asset_symbol": "AAPL",
            "timeframe": "1d",
            "total_trade": 42,
            "win_rate_percentage": Decimal("57.1400"),
        },
    )
    return int(created)


def _seed_progression_grants(session):
    added = 0
    for user in session.exec(select(User).where(User.email.in_(
        ["alice@example.com", "bob@example.com"]
    ))).all():
        _, created = _get_or_create(
            session, ProgressionGrant,
            user_id=user.id, source_type=ProgressionSource.puzzle, source_id=1,
            defaults={
                "xp_awarded": 50,
                "elo_delta": 10,
                "created_at": datetime.utcnow(),
            },
        )
        added += created
    return added


def _seed_multiplayer(session):
    """Create one completed match between Alice and Bob on the AAPL scenario."""
    alice = session.exec(select(User).where(User.email == "alice@example.com")).first()
    bob = session.exec(select(User).where(User.email == "bob@example.com")).first()
    if not (alice and bob):
        return 0, 0, 0

    scenario = session.exec(select(Scenario).where(Scenario.name == "AAPL Bull Run")).first()
    if not scenario:
        return 0, 0, 0

    existing = session.exec(
        select(MultiplayerMatch).where(
            MultiplayerMatch.scenario_id == scenario.id,
            MultiplayerMatch.player_one_id == alice.id,
            MultiplayerMatch.player_two_id == bob.id,
        )
    ).first()
    if existing:
        return 0, 0, 0

    now = datetime.utcnow()
    match = MultiplayerMatch(
        scenario_id=scenario.id,
        symbol=scenario.symbol,
        start_date=scenario.start_date,
        end_date=scenario.end_date,
        initial_balance=Decimal("10000"),
        status=MatchStatus.completed,
        player_one_id=alice.id,
        player_two_id=bob.id,
        winner_user_id=alice.id,
        current_day_index=10,
        started_at=now - timedelta(days=2),
        ended_at=now - timedelta(days=1),
        perturbation_seed=12345,
        perturbation_version="v1",
        data_snapshot_id="snap-001",
    )
    session.add(match)
    session.flush()

    session.add(MultiplayerParticipant(
        match_id=match.id, user_id=alice.id,
        cash_balance=Decimal("11250"), position_qty=Decimal("0"),
    ))
    session.add(MultiplayerParticipant(
        match_id=match.id, user_id=bob.id,
        cash_balance=Decimal("9850"), position_qty=Decimal("5"),
    ))

    session.add(MatchEventLog(
        match_id=match.id, seq=1, user_id=alice.id, day_index=0,
        event_type="start", payload={"note": "match started"},
        created_at=match.started_at,
    ))
    session.add(MatchEventLog(
        match_id=match.id, seq=2, user_id=alice.id, day_index=10,
        event_type="end", payload={"winner": "alice"},
        created_at=match.ended_at,
    ))
    session.flush()
    return 1, 2, 2


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def seed_data() -> None:
    with Session(engine) as session:
        print(f"✓ Currencies          (+{_seed_currencies(session)})")
        print(f"✓ Assets              (+{_seed_assets(session)})")
        print(f"✓ Stock assets        (+{_seed_stock_assets(session)})")
        print(f"✓ Strategies          (+{_seed_strategies(session)})")
        print(f"✓ Users               (+{_seed_users(session)})")
        print(f"✓ Scenarios           (+{_seed_scenarios(session)})")
        print(f"✓ News                (+{_seed_news(session)})")
        print(f"✓ Market conditions   (+{_seed_market_conditions(session)})")
        print(f"✓ QTE questions       (+{_seed_qte_questions(session)})")
        print(f"✓ Tech tree nodes     (+{_seed_tech_tree(session)})")

        p, a = _seed_portfolios_and_accounts(session)
        print(f"✓ Portfolios          (+{p})")
        print(f"✓ Intl accounts       (+{a})")

        print(f"✓ Transactions        (+{_seed_transactions(session)})")
        print(f"✓ Greeks              (+{_seed_greeks(session)})")

        r, s = _seed_reports(session)
        print(f"✓ Reports             (+{r})")
        print(f"✓ Report sections     (+{s})")

        print(f"✓ Practice sims       (+{_seed_practice_simulation(session)})")
        print(f"✓ Backtest results    (+{_seed_backtest_results(session)})")
        print(f"✓ Progression grants  (+{_seed_progression_grants(session)})")

        m, p2, e = _seed_multiplayer(session)
        print(f"✓ Multiplayer matches (+{m})")
        print(f"✓ Participants        (+{p2})")
        print(f"✓ Match events        (+{e})")

        session.commit()


if __name__ == "__main__":
    seed_data()
    print("\n✓ Database seeding complete")