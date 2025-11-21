FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code and modules
COPY backend/hf-space-deploy/app.py ./
COPY backend/hf-space-deploy/config.py ./
COPY backend/hf-space-deploy/services/ ./services/
COPY backend/hf-space-deploy/models/ ./models/

# HuggingFace Spaces uses port 7860
EXPOSE 7860

# Start uvicorn with app.py at root
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
