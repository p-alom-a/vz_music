# VLM Search Implementation - Setup Guide

## Overview

This guide will help you set up the VLM (Vision-Language Model) semantic search feature for SpotIt. The VLM search allows users to search for album covers using semantic descriptions (e.g., "minimalist album cover with bold typography").

## Implementation Summary

### What Was Implemented

✅ **Backend:**
- New VLM search engine class using `BAAI/bge-base-en-v1.5`
- `/api/search-vlm` endpoint for semantic text search
- `/api/vlm-stats` endpoint to show VLM coverage
- Supabase integration for vector similarity search
- Graceful fallback when Supabase is unavailable

✅ **Frontend:**
- Search mode selector (CLIP/VLM/Hybrid)
- VLM coverage indicator
- Enhanced result cards with expandable descriptions
- Mode-specific placeholders and UI styling
- Similarity score visualization

✅ **Database:**
- SQL function for VLM vector search (`search_albums_vlm`)

---

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `sentence-transformers>=2.2.0` - For text embeddings
- `supabase>=2.3.0` - For database vector search

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # NOT the anon key!
```

**Important:** You need the `service_role` key from Supabase, not the public `anon` key.

To find these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL (`SUPABASE_URL`)
4. Copy the `service_role` key under Project API keys (`SUPABASE_KEY`)

#### Create Supabase RPC Function

Run the SQL function in your Supabase SQL Editor:

```bash
# The SQL is in: backend/supabase_vlm_function.sql
```

Or execute it directly in Supabase dashboard:
1. Go to SQL Editor
2. Create a new query
3. Paste the contents of `backend/supabase_vlm_function.sql`
4. Run the query

This creates the `search_albums_vlm()` function that performs vector similarity search.

#### Verify Database Schema

Ensure your `album_covers` table has these columns:
- `id` (text)
- `artist` (text)
- `album_name` (text)
- `genre` (text)
- `release_year` (int)
- `pitchfork_score` (float)
- `best_new_music` (boolean)
- `cover_url` (text)
- `vlm_embedding` (vector(384))
- `vlm_description` (text)
- `vlm_processed` (boolean)
- `vlm_warning` (text, nullable)

#### Create Vector Index (Optional but Recommended)

For better performance with large datasets:

```sql
CREATE INDEX idx_vlm_embedding
ON album_covers
USING hnsw (vlm_embedding vector_cosine_ops);
```

#### Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

You should see:
```
🚀 Loading CLIP model...
🚀 Loading VLM text embedding model: BAAI/bge-base-en-v1.5...
🔌 Connecting to Supabase...
✅ VLM Search Engine ready! Embedding dimension: 768
✅ VLM search engine initialized
```

If you see errors, make sure your `SUPABASE_URL` and `SUPABASE_KEY` are correct.

---

### 2. Frontend Setup

#### Install Dependencies (if needed)

```bash
cd frontend
npm install
```

No new dependencies are needed - we only updated existing files.

#### Configure API URL

Update your `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # For local development
```

For production, set this to your deployed backend URL.

#### Start the Frontend

```bash
cd frontend
npm run dev
```

The app should now be running at `http://localhost:3000`.

---

### 3. Testing

#### Test Backend Endpoints

**Health Check:**
```bash
curl http://localhost:8000/
```

Should return VLM availability status.

**VLM Stats:**
```bash
curl http://localhost:8000/api/vlm-stats
```

Should return:
```json
{
  "success": true,
  "total_albums": 25790,
  "vlm_albums": 490,
  "vlm_percentage": 1.9
}
```

**VLM Search:**
```bash
curl "http://localhost:8000/api/search-vlm?query=minimalist%20album%20cover&k=5"
```

Should return search results with VLM descriptions.

#### Test Frontend

1. Open `http://localhost:3000`
2. Navigate to the text search tab
3. You should see three mode buttons: **CLIP**, **VLM**, **Hybrid**
4. Select **VLM** mode
5. You should see the VLM coverage indicator
6. Enter a semantic query like:
   - "minimalist album cover with bold typography"
   - "dark moody melancholic atmosphere"
   - "vintage 80s aesthetic with warm colors"
7. Results should show album descriptions below each cover

---

## Usage

### Search Modes

**CLIP (Visual Search):**
- Uses visual embeddings from album cover images
- Best for: Color queries, visual elements, specific objects
- Example: "red album cover", "person with sunglasses"

**VLM (Semantic Search):**
- Uses text descriptions of album covers
- Best for: Aesthetic descriptions, mood, style, composition
- Example: "minimalist design", "vintage aesthetic", "dark atmosphere"
- Coverage: ~490/25,790 albums (1.9%) as of now

**Hybrid (Coming Soon):**
- Combines CLIP and VLM results
- Will provide best of both worlds

### Sample VLM Queries

Good semantic queries for VLM:
- "minimalist album cover with bold typography"
- "dark moody melancholic atmosphere"
- "vintage 80s aesthetic with warm colors"
- "surreal dreamlike imagery"
- "black and white photography"
- "colorful psychedelic design"
- "urban street photography"
- "abstract geometric shapes"

---

## Files Modified/Created

### Backend
- ✅ `requirements.txt` - Added `sentence-transformers` and `supabase`
- ✅ `main.py` - Added VLM endpoints and initialization
- ✅ `utils/vlm_search.py` - **NEW** VLM search engine class
- ✅ `supabase_vlm_function.sql` - **NEW** SQL function for Supabase

### Frontend
- ✅ `types/index.ts` - Added VLM types
- ✅ `lib/api.ts` - Added VLM API functions
- ✅ `components/SearchByText.tsx` - Added mode selector and VLM logic
- ✅ `components/ResultsGrid.tsx` - Added VLM description display

---

## Troubleshooting

### Backend Issues

**"VLM search engine not available"**
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are set correctly
- Verify you're using the `service_role` key, not `anon` key
- Check Supabase project is accessible

**"RPC function not found"**
- Make sure you ran the SQL in `supabase_vlm_function.sql`
- Verify the function exists: Check Supabase Dashboard > Database > Functions

**"Model download is slow"**
- First run downloads the sentence-transformers model (~100MB)
- Subsequent runs will use the cached model

**"No VLM results found"**
- Check that your database has albums with `vlm_processed = TRUE`
- Verify `vlm_embedding` and `vlm_description` columns exist and have data

### Frontend Issues

**Mode selector not showing**
- Clear browser cache and reload
- Check browser console for errors

**VLM stats showing 0%**
- Backend may not be connected to Supabase
- Check backend logs for errors

**Results not showing descriptions**
- Make sure you're in VLM mode
- Check that API response includes `vlm_description` field

---

## Next Steps

### Phase 2 - Improvements
- [ ] Add loading skeletons for better UX
- [ ] Add query suggestions based on popular searches
- [ ] Implement caching for frequent queries
- [ ] Add analytics tracking for mode usage

### Phase 3 - Hybrid Mode
- [ ] Implement hybrid search combining CLIP + VLM
- [ ] Add weight sliders for user-controlled blending
- [ ] A/B test optimal default weights

### Future Enhancements
- [ ] Process remaining 25,300 albums with VLM
- [ ] Add query history/favorites
- [ ] Export search results
- [ ] Share search URLs

---

## Performance Notes

- **VLM text embedding:** ~50-100ms per query
- **Supabase vector search:** ~50-200ms (depends on index and dataset size)
- **Total VLM search time:** ~150-300ms average

For best performance:
- Create HNSW index on `vlm_embedding` column
- Use connection pooling for Supabase
- Consider caching frequent queries

---

## Support

If you encounter issues:
1. Check backend logs: `uvicorn main:app --reload --port 8000`
2. Check frontend console: Browser DevTools > Console
3. Verify Supabase connection in Supabase dashboard
4. Review this guide's troubleshooting section

For questions about the implementation, refer to:
- `backend/PLAN_RECHERCHEVLM.MD` - Original implementation plan
- API docs: `http://localhost:8000/docs` (when backend is running)
