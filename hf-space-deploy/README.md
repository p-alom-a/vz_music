---
title: Shazam Visual - Album Cover Search
emoji: 🎵
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# 🎵 Shazam Visual - Album Cover Search Engine

Visual similarity search for album covers using CLIP embeddings and Supabase vector database.

**Dataset:** 15,000+ album covers from Pitchfork reviews
**Model:** OpenAI CLIP ViT-B/32
**Database:** Supabase (PostgreSQL + pgvector)

## ✨ Features

- **Search by Image:** Upload an album cover to find visually similar albums
- **Search by Text:** Describe what you're looking for (e.g., "dark ambient cover", "red guitar")
- **Genre Filtering:** Refine results by music genre
- **Fast Vector Search:** Results in ~30-50ms using pgvector HNSW index
- **Rich Metadata:** Artist, album name, genre, release year, Pitchfork scores

## 🚀 API Endpoints

### 1. Root Endpoint
**GET /** - API information and available endpoints

```bash
curl https://your-space.hf.space/
```

### 2. Health Check
**GET /health** - Check API status

```bash
curl https://your-space.hf.space/health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": {
    "clip": true,
    "supabase": true
  },
  "total_albums": 15000
}
```

### 3. Search by Image
**POST /api/search-by-image** - Upload an image to find similar albums

**Parameters:**
- `file` (form-data): Image file (JPEG, PNG, max 10MB)
- `k` (optional): Number of results (default: 10, max: 50)
- `genre` (optional): Filter by genre (e.g., "Rock", "Electronic")

```bash
curl -X POST "https://your-space.hf.space/api/search-by-image?k=5" \
  -F "file=@album_cover.jpg"

# With genre filter
curl -X POST "https://your-space.hf.space/api/search-by-image?k=5&genre=Rock" \
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
      "id": "585",
      "artist": "Pink Floyd",
      "album_name": "The Dark Side of the Moon",
      "genre": "Rock",
      "release_year": 1973,
      "similarity": 0.89,
      "pitchfork_score": 10.0,
      "cover_url": "https://..."
    }
  ]
}
```

### 4. Search by Text
**GET /api/search-by-text** - Search using text descriptions

**Parameters:**
- `query` (required): Text description
- `k` (optional): Number of results (default: 10, max: 50)
- `genre` (optional): Filter by genre

```bash
curl "https://your-space.hf.space/api/search-by-text?query=dark%20ambient&k=5"

# With genre filter
curl "https://your-space.hf.space/api/search-by-text?query=guitar&genre=Rock&k=10"
```

**Text Search Tips:**
- Works better for visual concepts: "dark album", "colorful cover", "minimalist"
- Less effective for narrative descriptions
- Use concrete visual terms: colors, objects, compositions

### 5. Get Available Genres
**GET /api/genres** - List all available genres

```bash
curl https://your-space.hf.space/api/genres
```

**Response:**
```json
{
  "success": true,
  "total_genres": 15,
  "genres": ["Electronic", "Folk/Country", "Jazz", "Metal", "Pop/R&B", "Rock", ...]
}
```

### 6. Dataset Statistics
**GET /api/stats** - Get dataset statistics

```bash
curl https://your-space.hf.space/api/stats
```

**Response:**
```json
{
  "total_albums": 15000,
  "top_genres": [
    {"genre": "Rock", "count": 4500},
    {"genre": "Electronic", "count": 3200}
  ],
  "year_range": {
    "min": 1967,
    "max": 2024
  },
  "pitchfork_scores": {
    "average": 7.2,
    "min": 0.0,
    "max": 10.0,
    "best_new_music_count": 1200
  }
}
```

## 🏗️ Technical Details

### Architecture

**Three-Layer System:**

1. **API Layer** (`app.py`): FastAPI endpoints with genre filtering
2. **Inference Layer**: CLIP model for image/text embeddings
3. **Database Layer**: Supabase PostgreSQL with pgvector

**Data Flow:**
```
Image/Text → CLIP Embedding → L2 Normalization → Supabase RPC → Results
```

### Model Specifications

**CLIP Model:**
- **Name:** openai/clip-vit-base-patch32
- **Type:** Vision-Language Transformer
- **Embedding Dimension:** 512
- **Device:** CPU (HuggingFace Spaces)
- **Inference Time:** ~500ms per query on CPU

**Supabase Vector Database:**
- **Database:** PostgreSQL with pgvector extension
- **Index Type:** HNSW (Hierarchical Navigable Small World)
- **Search Time:** ~30-50ms for top-k retrieval
- **Similarity Metric:** Cosine similarity

### Database Schema

**Table: `album_covers`**
```sql
- id (text): Album identifier
- embedding (vector(512)): CLIP embedding
- artist (text): Artist name
- album_name (text): Album title
- genre (text): Primary genre
- release_year (integer): Year of release
- pitchfork_score (numeric): Review score (0-10)
- best_new_music (boolean): BNM designation
- cover_url (text): Album cover image URL
- reviewer (text): Pitchfork reviewer
- metadata (jsonb): Additional data
```

**RPC Function: `search_albums`**
```sql
search_albums(
  query_embedding vector(512),
  match_count int DEFAULT 10,
  filter_genre text DEFAULT NULL
)
```

### Performance Metrics

**Average Response Times:**
- Image search: ~500-600ms (CLIP inference + vector search)
- Text search: ~500-600ms
- Vector search alone: ~30-50ms (pgvector HNSW)
- Stats endpoint: ~100-200ms

**Bottlenecks:**
- CLIP inference on CPU (most of the time)
- Vector search is very fast with HNSW index

## 🔧 Environment Variables

Required secrets (set in HuggingFace Space settings):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
```

## 📊 Usage Examples

### Example 1: Find Similar Albums to an Image
```bash
# Upload a Pink Floyd album cover
curl -X POST "https://your-space.hf.space/api/search-by-image?k=10" \
  -F "file=@dark_side_of_moon.jpg"
```

### Example 2: Search by Text with Genre Filter
```bash
# Search for dark electronic albums
curl "https://your-space.hf.space/api/search-by-text?query=dark%20minimalist&genre=Electronic&k=15"

# Search for albums with red covers in Rock genre
curl "https://your-space.hf.space/api/search-by-text?query=red%20album%20cover&genre=Rock&k=10"
```

### Example 3: Get All Genres
```bash
# List available genres for dropdown menu
curl https://your-space.hf.space/api/genres
```

## 🚧 Limitations

- **Text Search Accuracy:** Works better for visual concepts than narrative descriptions
- **Dataset Scope:** Limited to Pitchfork-reviewed albums
- **No Fine-Tuning:** Uses pre-trained CLIP without fine-tuning
- **CPU Inference:** Slower than GPU but sufficient for API use

## 🔮 Future Improvements

- [ ] Fine-tune CLIP on album cover dataset
- [ ] Add multi-genre filtering
- [ ] Add year range filtering
- [ ] Implement API rate limiting
- [ ] Add authentication
- [ ] Create web UI frontend
- [ ] Implement caching for popular queries

## ⚠️ Troubleshooting

**Issue: "Supabase client not initialized"**
- Ensure environment variables are set in HuggingFace Space settings
- Use service_role key, not anon key

**Issue: "Out of memory"**
- CLIP model uses ~600MB RAM
- Upgrade to larger HuggingFace Space instance

**Issue: "Slow first request"**
- CLIP model downloads on first run (~600MB)
- Subsequent requests are faster

**Issue: "RPC function not found"**
- Verify `search_albums` function exists in Supabase
- Check pgvector extension is enabled

## 📄 License

This project is for educational and research purposes. Album cover images are copyrighted by their respective owners.

---

**Built with:**
- [FastAPI](https://fastapi.tiangolo.com/)
- [CLIP](https://github.com/openai/CLIP) by OpenAI
- [Supabase](https://supabase.com/) with pgvector
- [HuggingFace Transformers](https://huggingface.co/transformers/)
