# Backend Overview

The backend is a small FastAPI app in `backend/app/`.

What it does:
- Exposes `GET /health` and `GET /demo` through the `core` Epic
- Keeps endpoint logic in Epic controllers and business logic in Epic services
- Uses SQLModel tables in a dedicated models package

Where it lives:
- App entry point: `backend/app/main.py`
- Epic controllers/services/DTOs: `backend/app/epics/<epic_name>/`
- Models: `backend/app/models/`
- Settings: `backend/app/settings.py`
- Database session helper: `backend/app/database.py`
- Tests: `backend/tests/`

Smallest example:
- Open `GET /health`
- Open `GET /demo`
