# Background Jobs

The repo includes a small Celery example for asynchronous work.

What it does:
- Demonstrates how background tasks will be organized
- Uses Redis as the broker for local development
- Keeps long-running work out of request handlers

Where it lives:
- Task app: `backend/app/tasks.py`
- Broker config: `.env.example`
- Redis service: `docker-compose.yml`
- Background job triggers can be called from Epic services

Smallest example:
- Run the Redis service
- Call the `generate_report` task
