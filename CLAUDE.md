# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visual search backend API for album covers (similar to "Shazam for images"). The system uses CLIP embeddings and Supabase (PostgreSQL + pgvector) for similarity search across 15,000+ album covers.

**Tech Stack:**
- FastAPI (Python web framework)
- CLIP (OpenAI's vision-language model) via Transformers
- Supabase (PostgreSQL with pgvector extension)
- Pre-computed embeddings stored in Supabase

## Architecture

The backend follows a three-layer architecture:

1. **API Layer** (`app.py`): FastAPI endpoints for image/text search and genre filtering
2. **Search Engine** (CLIP model): CLIP model inference for generating embeddings
3. **Data Layer** (Supabase): PostgreSQL database with pgvector for similarity search

**Key Components:**
- CLIP model loaded at startup for generating embeddings from images/text
- Two search modes: image-to-image and text-to-image using CLIP's multimodal capabilities
- Cosine similarity search via Supabase RPC function with L2-normalized embeddings
- Optional genre filtering for refined search results

## Development Commands

### Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

### Running the API
```bash
# Development server with auto-reload
uvicorn app:app --reload --port 8000

# Production
uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Testing
```bash
# Health check
curl "http://localhost:8000/health"

# Search by text
curl "http://localhost:8000/api/search-by-text?query=red%20album&k=5"

# Search by text with genre filter
curl "http://localhost:8000/api/search-by-text?query=guitar&genre=Rock&k=10"

# Get all genres
curl "http://localhost:8000/api/genres"

# Search by image
curl -X POST "http://localhost:8000/api/search-by-image?k=5" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_album.jpg"

# Search by image with genre filter
curl -X POST "http://localhost:8000/api/search-by-image?k=5&genre=Electronic" \
  -F "file=@test_album.jpg"

# Get statistics
curl "http://localhost:8000/api/stats"

# Interactive testing via Swagger UI
# Visit http://localhost:8000/docs
```

## Important Implementation Details

### CLIP Model Integration
- Model: `openai/clip-vit-base-patch32` (downloaded from HuggingFace on first run)
- Device: Uses CPU (suitable for HuggingFace Spaces)
- Embeddings are L2-normalized before Supabase search (required for cosine similarity)
- Embedding dimension: 512

### Supabase Integration
- Database: PostgreSQL with pgvector extension
- Table: `album_covers` with columns:
  - `id` (text): Album identifier
  - `embedding` (vector(512)): CLIP embedding
  - `artist`, `album_name`, `genre`, `release_year`, `pitchfork_score`, `best_new_music`, `cover_url`
- RPC Function: `search_albums(query_embedding, match_count, filter_genre)`
  - Returns similar albums ranked by cosine similarity
  - Optional genre filtering
- HNSW index for fast vector search

### API Startup Sequence
1. Load CLIP model and processor from HuggingFace
2. Initialize Supabase client with environment credentials
3. Verify database connection
4. API becomes available

**Critical**:
- Model loading is synchronous on startup. First request may be slow if CLIP model needs downloading.
- Requires `SUPABASE_URL` and `SUPABASE_KEY` environment variables

### CORS Configuration
Currently configured for:
- Permissive CORS (allow all origins) - suitable for development
- For production: Update `allow_origins` in `app.py` to include specific frontend URLs

### Error Handling
- Image upload validation: Check `content_type` starts with `image/`
- Empty query validation for text search
- File size limit: 10MB max
- Graceful error responses with 400/500 status codes

## Deployment (HuggingFace Spaces)

### Backend Deployment
**Required files:**
- `app.py`: Main FastAPI application
- `requirements.txt`: Python dependencies (including supabase==2.3.0)

**Environment variables (Secrets):**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Service role key (not anon key!)

**Resource requirements:**
- Minimum: 512 MB RAM
- Recommended: 1 GB RAM (CLIP model can be memory-intensive)
- No local storage needed (all data in Supabase)

### Frontend Integration
Frontend should:
1. Set API URL environment variable to point to HuggingFace Space
2. Handle new response format with `similarity` instead of `similarity_score`
3. Use `cover_url` field for images (served directly from Supabase Storage)
4. Support optional `genre` parameter for filtered searches

## Project Structure
```
backend/
├── app.py                     # FastAPI application with routes
├── requirements.txt           # Python dependencies
├── CLAUDE.md                  # This file - instructions for Claude Code
├── PLAN.md                    # Migration plan documentation
└── README.md                  # User documentation
```

## Common Issues

**Issue: "Supabase client not initialized"**
- Ensure `SUPABASE_URL` and `SUPABASE_KEY` environment variables are set
- Verify the credentials are correct (use service_role key, not anon key)
- Check Supabase project is accessible

**Issue: "Out of memory"**
- CLIP model (~600MB) can exceed 512MB RAM
- Upgrade to 1GB RAM on HuggingFace Spaces
- Model caching helps - subsequent starts are faster

**Issue: "Slow first request"**
- CLIP model downloads from HuggingFace on first run (~600MB)
- HuggingFace Spaces caches the model after first download
- First API call triggers model inference (can take 2-3 seconds)

**Issue: "RPC function not found"**
- Ensure `search_albums` RPC function exists in Supabase
- Verify function signature matches expected parameters
- Check pgvector extension is enabled

**Issue: "CORS errors"**
- Update `allow_origins` in `app.py` CORSMiddleware configuration
- Verify frontend URL matches exactly (trailing slash matters)
- Current config allows all origins (suitable for development)
