from fastapi import FastAPI
import logging

from sqlmodel import SQLModel

from .database import engine
from . import models  # ensure models are imported so SQLModel metadata is populated
from .settings import settings

from .epics.core.CoreController import router as core_router
from .epics.market_data.MarketDataController import router as market_data_router
from .epics.portfolio.PortfolioController import router as portfolio_router
from .epics.ui.UiController import router as ui_router
from .epics.auth.AuthController import router as auth_router

app = FastAPI(title="AutoFlow Trade Simulator")


@app.on_event("startup")
def on_startup() -> None:
	"""Ensure database schema matches SQLModel models at app startup.

	This calls SQLModel.metadata.create_all(engine) so tables are created
	automatically. For production deployments you may want to disable
	automatic schema creation and rely on migrations instead.
	"""
	if settings.auto_sync_db:
		logging.getLogger("uvicorn").info("Creating database tables from SQLModel metadata...")
		SQLModel.metadata.create_all(engine)
	else:
		logging.getLogger("uvicorn").info("Database auto-sync disabled (auto_sync_db=False)")


app.include_router(core_router)
app.include_router(market_data_router)
app.include_router(ui_router)
app.include_router(portfolio_router)
app.include_router(auth_router)
