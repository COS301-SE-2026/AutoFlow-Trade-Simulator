FROM python:3.11-slim

RUN groupadd -r appgroup && useradd -r -g appgroup -s /sbin/nologin appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py config.yaml ./
COPY data_harvester/ ./data_harvester/
COPY stock-poller/ ./stock-poller/

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["python", "main.py"]