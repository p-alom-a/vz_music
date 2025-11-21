# 🎵 Shazam Visual - Backend API

Visual search engine for album covers using CLIP embeddings and FAISS.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Place model files in `models/` folder:**
   - `album_covers.index` (FAISS index)
   - `metadata.pkl` (metadata)

3. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Access API:**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs

## Endpoints

### POST /api/search-by-image
Upload an image to find similar album covers.

**Parameters:**
- `file`: Image file (JPEG, PNG)
- `k`: Number of results (default: 5)

### GET /api/search-by-text
Search by text description.

**Parameters:**
- `query`: Text description (e.g., "a red album with guitar")
- `k`: Number of results (default: 5)

## Example Usage

```bash
# Search by image
curl -X POST "http://localhost:8000/api/search-by-image?k=5" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@album_cover.jpg"

# Search by text
curl "http://localhost:8000/api/search-by-text?query=red%20album&k=5"
```
