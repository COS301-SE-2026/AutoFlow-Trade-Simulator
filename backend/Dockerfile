FROM python:3.11.9-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc=4:12.2.0-3 \
        libpq-dev=15.18-0+deb12u1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup --create-home appuser

COPY requirements.txt .

RUN pip install \
    --only-binary :all: \
    --default-timeout=100 \
    --retries=5 \
    --no-cache-dir \
    --require-hashes \
    -r requirements.txt
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini
COPY seeds.py /app/seeds.py
COPY .env /app/.env
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown -R appuser:appgroup /app /entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]