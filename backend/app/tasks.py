from celery import Celery

from .settings import settings

celery_app = Celery("autoflow", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(name="generate_report")
def generate_report(user_id: int) -> dict[str, str | int]:
    return {"status": "generated", "user_id": user_id}
