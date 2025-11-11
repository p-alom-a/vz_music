# 🎵 Shazam Visual - Album Cover Search Engine

Visual similarity search for album covers using CLIP embeddings and FAISS indexing.

**Dataset:** 25,790 album covers from Pitchfork reviews (1999-2024)
**Model:** OpenAI CLIP ViT-B/32
**Index:** FAISS (Flat Inner Product)

## Features

- **Search by Image:** Upload an album cover to find visually similar albums
- **Search by Text:** Describe what you're looking for (e.g., "dark ambient cover", "red guitar")
- **Fast Similarity Search:** Results in less than 100ms using FAISS
- **Large Dataset:** 25,790+ album covers indexed
- **Rich Metadata:** Artist, album name, genre, release year, Pitchfork scores

## API Endpoints

### 1. Root Endpoint
**GET /** - API information and available endpoints

```bash
curl https://your-space.hf.space/
```

**Response:**
```json
{
  "message": "🎵 Shazam Visual - Album Cover Search Engine",
  "status": "running",
  "total_albums": 25790,
  "endpoints": { ... },
  "documentation": "/docs"
}
```

### 2. Health Check
**GET /health** - Check API status and models

```bash
curl https://your-space.hf.space/health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": {
    "clip": true,
    "faiss": true,
    "metadata": true
  },
  "total_albums": 25790,
  "response_time_ms": 1.23
}
```

### 3. Search by Image
**POST /api/search-by-image** - Upload an image to find similar albums

**Parameters:**
- `file` (form-data): Image file (JPEG, PNG, max 10MB)
- `k` (optional): Number of results (default: 10, max: 50)

```bash
curl -X POST "https://your-space.hf.space/api/search-by-image?k=5" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@album_cover.jpg"
```

**Response:**
```json
{
  "success": true,
  "query_type": "image",
  "total_results": 5,
  "results": [
    {
      "album_id": 4761,
      "artist": "Pink Floyd",
      "album_name": "The Dark Side of the Moon",
      "genre": "Rock",
      "release_year": 1973,
      "similarity_score": 0.953,
      "pitchfork_score": 10.0,
      "best_new_music": false,
      "image_url": "/api/image/4761",
      "cover_url_original": "https://..."
    }
  ]
}
```

### 4. Search by Text
**GET /api/search-by-text** - Search using text descriptions

**Parameters:**
- `query` (required): Text description
- `k` (optional): Number of results (default: 10, max: 50)

```bash
curl "https://your-space.hf.space/api/search-by-text?query=dark%20ambient&k=5"
```

**Response:** Same format as search-by-image

**Text Search Tips:**
- Works better for visual concepts: "dark album", "colorful cover", "minimalist"
- Less effective for narrative descriptions: "album about heartbreak"
- Use concrete visual terms: colors, objects, compositions

### 5. Get Album Image
**GET /api/image/{album_id}** - Retrieve album cover image

**Parameters:**
- `album_id` (path): Album's local ID

```bash
curl "https://your-space.hf.space/api/image/4761" --output album.jpg
```

**Response:** JPEG image with cache headers (24h cache)

**Error Codes:**
- 404: Album ID not found or image file missing

### 6. Dataset Statistics
**GET /api/stats** - Get dataset statistics

```bash
curl https://your-space.hf.space/api/stats
```

**Response:**
```json
{
  "total_albums": 25790,
  "total_indexed": 25790,
  "top_genres": [
    {"genre": "Rock", "count": 8234},
    {"genre": "Electronic", "count": 5421}
  ],
  "year_range": {
    "min": 1999,
    "max": 2024
  },
  "pitchfork_scores": {
    "average": 7.2,
    "min": 0.0,
    "max": 10.0,
    "best_new_music_count": 1234
  }
}
```

## Usage Examples

### Example 1: Find Similar Albums to an Image
```bash
# Upload a Pink Floyd album cover
curl -X POST "https://your-space.hf.space/api/search-by-image?k=10" \
  -F "file=@dark_side_of_moon.jpg"

# Returns psychedelic and progressive rock albums with similar aesthetics
```

### Example 2: Search by Text Description
```bash
# Search for dark, minimalist covers
curl "https://your-space.hf.space/api/search-by-text?query=dark%20minimalist%20cover&k=20"

# Search for albums with red color palette
curl "https://your-space.hf.space/api/search-by-text?query=red%20album%20cover&k=15"
```

### Example 3: Get Album Details and Image
```bash
# Search and download first result's image
ALBUM_ID=$(curl "https://your-space.hf.space/api/search-by-text?query=jazz&k=1" | jq -r '.results[0].album_id')
curl "https://your-space.hf.space/api/image/$ALBUM_ID" --output jazz_album.jpg
```

## Technical Details

### Architecture

**Three-Layer System:**

1. **API Layer** (`app.py`): FastAPI endpoints
2. **Inference Layer**: CLIP model for image/text embeddings
3. **Search Layer**: FAISS for fast similarity search

**Data Flow:**
```
Image/Text → CLIP Embedding → L2 Normalization → FAISS Search → Results + Metadata
```

### Model Specifications

**CLIP Model:**
- **Name:** openai/clip-vit-base-patch32
- **Type:** Vision-Language Transformer
- **Embedding Dimension:** 512
- **Device:** CPU (HuggingFace Spaces)
- **Inference Time:** ~500ms per query on CPU

**FAISS Index:**
- **Type:** Flat Inner Product (IndexFlatIP)
- **Size:** ~50MB for 25,790 vectors (512D)
- **Search Time:** <10ms for top-k retrieval
- **Similarity Metric:** Cosine similarity (via L2 normalization)

### Dataset Information

**Source:** Pitchfork album reviews (1999-2024)
**Total Albums:** 25,790
**Image Format:** JPEG (album_0.jpg to album_25789.jpg)
**Total Size:** ~8 GB

**Metadata Fields:**
- `local_id`: Unique identifier (0-25789)
- `artist`: Artist name
- `album_name`: Album title
- `genre`: Primary genre(s)
- `label`: Record label
- `release_year`: Year of release
- `score`: Pitchfork review score (0-10)
- `best_new_music`: Boolean flag for BNM designation
- `reviewer_name`: Pitchfork reviewer
- `cover_url`: Original Pitchfork image URL

### Performance Metrics

**Average Response Times:**
- Image search: ~500-600ms (CLIP inference + FAISS search)
- Text search: ~500-600ms
- Image retrieval: ~10-50ms (file read + transfer)
- Stats endpoint: ~50-100ms (metadata aggregation)

**Bottlenecks:**
- CLIP inference on CPU (most of the time)
- FAISS search is negligible (<10ms)
- Image upload/download limited by network

## Setup Instructions

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd hf-space-deploy
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Download models and images** (see models/README.txt and images/README.txt)
   - Place `album_covers.index` in `models/`
   - Place `valid_metadata_final.json` in `models/`
   - Place all album images in `images/`

4. **Run the API**
```bash
uvicorn app:app --reload --port 7860
```

5. **Test endpoints**
```bash
# Check health
curl http://localhost:7860/health

# Test text search
curl "http://localhost:7860/api/search-by-text?query=jazz&k=5"
```

6. **Access interactive docs**
   - Open http://localhost:7860/docs in your browser
   - Swagger UI for testing all endpoints

### HuggingFace Spaces Deployment

1. **Create a new Space**
   - Go to https://huggingface.co/new-space
   - Name: `shazam-visual` (or your choice)
   - SDK: Docker or Gradio
   - Visibility: Public (change to private later if needed)

2. **Upload code files**
   - `app.py`
   - `requirements.txt`
   - `README.md`
   - `.gitignore`

3. **Upload large files separately** (via web interface or Git LFS)
   - `models/album_covers.index` (~50 MB)
   - `models/valid_metadata_final.json` (~10 MB)
   - `images/album_*.jpg` (25,790 files, ~8 GB total)

4. **Wait for build and deployment**
   - HF Spaces will install dependencies and start the app
   - Check logs for any errors
   - Test with `/health` endpoint

5. **Configure settings** (optional)
   - Adjust hardware (CPU Basic is sufficient)
   - Set to private if needed
   - Add custom domain

## Limitations

- **Text Search Accuracy:** Works better for visual concepts (colors, objects, styles) than narrative descriptions or semantic meaning
- **Image-to-Image vs Text-to-Image:** Image search is generally more accurate than text search due to CLIP's training
- **Dataset Scope:** Limited to Pitchfork-reviewed albums (biased towards indie/alternative)
- **No Fine-Tuning:** Uses pre-trained CLIP without fine-tuning on album covers
- **CPU Inference:** Slower than GPU but sufficient for single-user queries

## Future Improvements

- [ ] Fine-tune CLIP on album cover dataset for better accuracy
- [ ] Add genre/year/score filters to search
- [ ] Implement API rate limiting
- [ ] Add authentication for private use
- [ ] Optimize image loading (lazy loading, compression)
- [ ] Add batch search endpoint
- [ ] Create web UI frontend
- [ ] Implement caching for popular queries
- [ ] Add more metadata (track listings, BPM, mood tags)

## Troubleshooting

### Common Issues

**Issue: "FAISS index not found"**
- Ensure `models/album_covers.index` exists
- Check file path is correct relative to where uvicorn runs

**Issue: "Out of memory"**
- CLIP model (~600MB) + FAISS index can use >1GB RAM
- Upgrade to HF Spaces with more RAM
- Consider using a smaller CLIP variant

**Issue: "Slow first request"**
- CLIP model downloads from HuggingFace on first run (~600MB)
- Subsequent requests will be faster (model is cached)

**Issue: "Image not found (404)"**
- Check that `images/album_{id}.jpg` exists
- Verify album_id matches metadata entries

**Issue: "CORS errors from frontend"**
- Update `allow_origins` in CORS middleware
- Ensure frontend URL is whitelisted

## License

This project is for educational and research purposes. Album cover images are copyrighted by their respective owners.

## Contact

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with:**
- [FastAPI](https://fastapi.tiangolo.com/)
- [CLIP](https://github.com/openai/CLIP) by OpenAI
- [FAISS](https://github.com/facebookresearch/faiss) by Meta AI
- [HuggingFace Transformers](https://huggingface.co/transformers/)
