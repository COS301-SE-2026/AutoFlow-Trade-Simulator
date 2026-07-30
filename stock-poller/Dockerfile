FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

RUN groupadd -r appgroup && useradd -r -g appgroup -s /sbin/nologin appuser

WORKDIR /app

COPY requirements.lock.txt .
RUN pip install --no-cache-dir --only-binary :all: --require-hashes -r requirements.lock.txt

COPY main.py config.yaml base_adapter.py adapters.py db.py ingestion.py ./

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["python", "main.py"]