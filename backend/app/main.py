from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager

from sqlmodel import SQLModel

from .database import engine
from .settings import settings

from .epics.core.CoreController import router as core_router
from .epics.market_data.MarketDataController import router as market_data_router
from .epics.portfolio.PortfolioController import router as portfolio_router
from .epics.ui.UiController import router as ui_router
from .epics.auth.AuthController import router as auth_router
from .epics.accounts.AccountsController import router as accounts_router


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


app.include_router(core_router)
app.include_router(market_data_router)
app.include_router(ui_router)
app.include_router(portfolio_router)
app.include_router(auth_router)
app.include_router(accounts_router)
