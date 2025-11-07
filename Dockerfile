FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code and models
COPY backend/ ./backend/

# Change to backend directory
WORKDIR /app/backend

# HuggingFace Spaces uses port 7860
EXPOSE 7860

# Start uvicorn directly (no need for start.sh on HF Spaces)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
