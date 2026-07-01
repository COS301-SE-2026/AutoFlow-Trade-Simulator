# Use a slim, stable python image to minimize footprint
FROM python:3.11-slim

# Prevent Python from writing .pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1

# Force stdout/stderr streams to be unbuffered so logs appear instantly
ENV PYTHONUNBUFFERED=1

# Establish a functional working directory inside the container
WORKDIR /app

# Copy only requirements first to leverage Docker's layer caching
COPY requirements.txt .

# Install dependencies cleanly without storing local pip caches
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Explicitly create the default mount point for the data lake
RUN mkdir -p /app/storage/raw_harvest

# Execute the central async orchestration runner
CMD ["python", "main.py"]