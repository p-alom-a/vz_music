# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visual search backend API for album covers (similar to "Shazam for images"). The system uses CLIP embeddings and FAISS for similarity search across 20,000 album covers.

**Tech Stack:**
- FastAPI (Python web framework)
- CLIP (OpenAI's vision-language model) via Transformers
- FAISS (Facebook AI Similarity Search)
- Pre-computed embeddings stored in FAISS index

## Architecture

The backend follows a three-layer architecture:

1. **API Layer** (`main.py`): FastAPI endpoints for image/text search
2. **Search Engine** (`utils/search.py`): CLIP model inference + FAISS similarity search
3. **Data Layer** (`models/`): Pre-computed FAISS index and metadata

**Key Components:**
- `AlbumSearchEngine`: Singleton that loads CLIP model and FAISS index at startup
- Two search modes: image-to-image and text-to-image using CLIP's multimodal capabilities
- Cosine similarity search via FAISS with L2-normalized embeddings

## Development Commands

### Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Ensure model files are in place (must be done manually)
# - models/album_covers.index (FAISS index)
# - models/metadata.pkl (pickle file with labels)
```

### Running the API
```bash
# Development server with auto-reload
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Testing
```bash
# Manual testing via curl
curl -X POST "http://localhost:8000/api/search-by-image?k=5" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_album.jpg"

curl "http://localhost:8000/api/search-by-text?query=red%20album&k=5"

# Interactive testing via Swagger UI
# Visit http://localhost:8000/docs
```

## Important Implementation Details

### CLIP Model Integration
- Model: `openai/clip-vit-base-patch32` (downloaded from HuggingFace on first run)
- Device auto-detection: Uses CUDA if available, otherwise CPU
- Embeddings are L2-normalized before FAISS search (required for cosine similarity)

### FAISS Index Format
- Pre-computed index contains ~20k album cover embeddings
- Metadata pickle contains corresponding genre labels
- Index structure assumes flat L2 index (cosine similarity via normalization)

### API Startup Sequence
1. Load CLIP model and processor from HuggingFace
2. Load pre-computed FAISS index from disk
3. Load metadata pickle
4. Verify index size matches metadata
5. API becomes available

**Critical**: Model loading is synchronous on startup. First request may be slow if CLIP model needs downloading.

### CORS Configuration
Currently configured for:
- Local frontend: `http://localhost:3000`
- Railway deployment: Update `allow_origins` in `main.py` to include production URLs

### Error Handling
- Image upload validation: Check `content_type` starts with `image/`
- Empty query validation for text search
- Graceful error responses with 400/500 status codes

## Deployment (Railway)

### Backend Deployment
**Required files:**
- `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `PYTHONUNBUFFERED=1`, `PORT` (auto-set by Railway)

**Model file handling options:**
1. Commit to Git (if <100MB)
2. Use Railway Volumes for persistent storage
3. Download from external URL on startup (recommended for large files)

**Resource requirements:**
- Minimum: 512 MB RAM
- Recommended: 1 GB RAM (CLIP model + FAISS index can be memory-intensive)

### Frontend Integration
Frontend should set environment variable:
```
NEXT_PUBLIC_API_URL=https://shazam-backend.up.railway.app
```

Update CORS in `main.py` to include frontend URL.

## Project Structure
```
backend/
├── main.py                    # FastAPI application with routes
├── requirements.txt           # Python dependencies
├── Procfile                   # Railway deployment config
├── models/
│   ├── album_covers.index    # FAISS index (binary)
│   └── metadata.pkl          # Pickle with genre labels
├── utils/
│   └── search.py             # AlbumSearchEngine class
└── README.md                 # User documentation
```

## Common Issues

**Issue: "FAISS index not found"**
- Ensure `models/album_covers.index` and `models/metadata.pkl` are present
- Check file paths are relative to where uvicorn is run from

**Issue: "Out of memory"**
- CLIP model (~600MB) + FAISS index can exceed 512MB RAM
- Upgrade to 1GB RAM on Railway or use smaller CLIP variant

**Issue: "Slow first request"**
- CLIP model downloads from HuggingFace on first run (~600MB)
- Consider pre-downloading model or using cached HuggingFace directory

**Issue: "CORS errors"**
- Update `allow_origins` in `main.py` CORSMiddleware configuration
- Verify frontend URL matches exactly (trailing slash matters)
