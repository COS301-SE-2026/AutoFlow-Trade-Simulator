from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from sqlmodel import SQLModel

from .database import engine
from .settings import settings

from .epics.core.CoreController import router as core_router
from .epics.market_data.MarketDataController import router as market_data_router
from .epics.portfolio.PortfolioController import router as portfolio_router
from .epics.greeks.GreeksController import router as greeks_router
from .epics.ui.UiController import router as ui_router
from .epics.auth.AuthController import router as auth_router
from .epics.accounts.AccountsController import router as accounts_router
from .epics.portfolio.ReportController import router as report_router
from .epics.simulation.SimulationController import router as simulation_router
from .epics.Datapoints.DatapointsController import router as chart_router
from .epics.real_time_data.RealTimeDataController import router as real_time 


@asynccontextmanager
async def lifespan(_: FastAPI):
	"""Run app startup and shutdown tasks via FastAPI lifespan hooks."""
	if settings.auto_sync_db:
		logging.getLogger("uvicorn").info("Creating database tables from SQLModel metadata...")
		SQLModel.metadata.create_all(engine)
	else:
		logging.getLogger("uvicorn").info("Database auto-sync disabled (auto_sync_db=False)")

	yield

app = FastAPI(title="AutoFlow Trade Simulator", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://auto-flow-trade-simulator.vercel.app",
    ],
    # Vercel preview deployments get a generated subdomain per branch.
    allow_origin_regex=r"https://auto-flow-trade-simulator-[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(market_data_router)
app.include_router(ui_router)
app.include_router(portfolio_router)
app.include_router(greeks_router)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(report_router)
app.include_router(simulation_router)
app.include_router(chart_router)
app.include_router(real_time)
