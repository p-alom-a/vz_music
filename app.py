from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from transformers import CLIPModel, CLIPProcessor
from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import numpy as np
import json
import os
import io
from typing import List, Dict, Any, Optional
import logging
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Shazam Visual - Album Cover Search Engine",
    description="Visual similarity search for album covers using CLIP embeddings and FAISS indexing",
    version="1.0.0"
)

# CORS Configuration - Permissive for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for loaded models and data
clip_model = None
clip_processor = None
vlm_model = None
device = None
supabase: Optional[Client] = None

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_K = 50
DEFAULT_K = 10

# Supabase configuration (from environment variables)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def load_clip_model():
    """Load CLIP model and processor"""
    logger.info("Loading CLIP model (openai/clip-vit-base-patch32)...")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    dev = torch.device("cpu")  # HF Spaces uses CPU
    model = model.to(dev)
    model.eval()
    logger.info(f"CLIP model loaded successfully on {dev}")
    return model, processor, dev


def load_vlm_model():
    """Load VLM text embedding model for semantic search"""
    logger.info("Loading VLM model (BAAI/bge-base-en-v1.5)...")
    model = SentenceTransformer("BAAI/bge-base-en-v1.5")
    logger.info(f"VLM model loaded successfully (embedding dim: 768)")
    return model


def init_supabase() -> Client:
    """Initialize Supabase client"""
    logger.info("Initializing Supabase client...")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
    return client


@app.on_event("startup")
async def startup_event():
    """Load models and data at startup"""
    global clip_model, clip_processor, vlm_model, device, supabase

    try:
        # Load CLIP model
        clip_model, clip_processor, device = load_clip_model()

        # Load VLM model
        vlm_model = load_vlm_model()

        # Initialize Supabase client
        supabase = init_supabase()

        # Get album count from Supabase
        count_response = supabase.table('album_covers').select('id', count='exact').limit(1).execute()
        total_albums = count_response.count if hasattr(count_response, 'count') else 0

        # Get VLM count from Supabase
        vlm_response = supabase.table('album_covers').select('id', count='exact').eq('vlm_processed', True).execute()
        vlm_albums = vlm_response.count if hasattr(vlm_response, 'count') else 0

        logger.info("=" * 60)
        logger.info("SpotIt API is ready!")
        logger.info(f"Total albums indexed: {total_albums}")
        logger.info(f"VLM albums: {vlm_albums} ({vlm_albums/total_albums*100:.1f}%)" if total_albums > 0 else "VLM albums: 0")
        logger.info(f"Device: {device}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise


@app.get("/")
def root():
    """API information endpoint"""
    # Get total albums count
    total_albums = 0
    if supabase:
        try:
            count_response = supabase.table('album_covers').select('id', count='exact').limit(1).execute()
            total_albums = count_response.count if hasattr(count_response, 'count') else 0
        except:
            pass

    return {
        "message": "🎵 Shazam Visual - Album Cover Search Engine",
        "status": "running",
        "total_albums": total_albums,
        "endpoints": {
            "search_by_image": "POST /api/search-by-image",
            "search_by_text": "GET /api/search-by-text",
            "get_genres": "GET /api/genres",
            "stats": "GET /api/stats",
            "health": "GET /health",
            "docs": "GET /docs"
        },
        "documentation": "/docs"
    }


@app.get("/health")
def health():
    """Health check endpoint"""
    import time
    start = time.time()

    is_healthy = all([
        clip_model is not None,
        clip_processor is not None,
        supabase is not None
    ])

    # Get total albums count
    total_albums = 0
    if supabase:
        try:
            count_response = supabase.table('album_covers').select('id', count='exact').limit(1).execute()
            total_albums = count_response.count if hasattr(count_response, 'count') else 0
        except:
            pass

    response_time = time.time() - start

    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "models_loaded": {
            "clip": clip_model is not None,
            "supabase": supabase is not None
        },
        "total_albums": total_albums,
        "response_time_ms": round(response_time * 1000, 2)
    }


@app.post("/api/search-by-image")
async def search_by_image(
    file: UploadFile = File(...),
    k: int = DEFAULT_K,
    genre: Optional[str] = None
):
    """
    Search for similar album covers by uploading an image.

    Parameters:
    - file: Image file (JPEG, PNG, etc.)
    - k: Number of results to return (default: 10, max: 50)
    - genre: Optional genre filter (e.g., "Rock", "Electronic")

    Returns:
    - JSON with similar albums ranked by similarity
    """
    # Validate k parameter
    if k < 1 or k > MAX_K:
        raise HTTPException(400, f"k must be between 1 and {MAX_K}")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    try:
        # Read image
        image_bytes = await file.read()

        # Check file size
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(413, f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)")

        # Open and convert to RGB
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Generate CLIP embedding
        inputs = clip_processor(images=image, return_tensors="pt").to(device)
        with torch.no_grad():
            embedding = clip_model.get_image_features(**inputs).cpu().numpy()

        # Normalize for cosine similarity (L2 normalization)
        embedding = embedding / np.linalg.norm(embedding)

        # Convert numpy array to list for Supabase RPC
        embedding_list = embedding[0].tolist()

        # Search in Supabase using RPC function
        params = {
            'query_embedding': embedding_list,
            'match_count': k
        }
        if genre:
            params['filter_genre'] = genre

        result = supabase.rpc('search_albums', params).execute()

        # Format results
        results = []
        for album in result.data:
            results.append({
                "id": album["id"],
                "artist": album.get("artist"),
                "album_name": album.get("album_name"),
                "genre": album.get("genre"),
                "release_year": album.get("release_year"),
                "similarity": float(album.get("similarity", 0)),
                "pitchfork_score": float(album["pitchfork_score"]) if album.get("pitchfork_score") else None,
                "cover_url": album.get("cover_url")
            })

        return {
            "success": True,
            "query_type": "image",
            "total_results": len(results),
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search by image failed: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


@app.get("/api/search-by-text")
async def search_by_text(
    query: str,
    k: int = DEFAULT_K,
    genre: Optional[str] = None
):
    """
    Search for album covers by text description.

    Parameters:
    - query: Text description (e.g., "dark ambient music", "red album cover")
    - k: Number of results to return (default: 10, max: 50)
    - genre: Optional genre filter (e.g., "Rock", "Electronic")

    Returns:
    - JSON with similar albums ranked by similarity
    """
    # Validate query
    if not query or len(query.strip()) == 0:
        raise HTTPException(400, "Query cannot be empty")

    # Validate k parameter
    if k < 1 or k > MAX_K:
        raise HTTPException(400, f"k must be between 1 and {MAX_K}")

    try:
        logger.info(f"Text search query: '{query}' (k={k}, genre={genre})")

        # Generate CLIP text embedding
        inputs = clip_processor(text=query, return_tensors="pt").to(device)
        with torch.no_grad():
            embedding = clip_model.get_text_features(**inputs).cpu().numpy()

        # Normalize for cosine similarity (L2 normalization)
        embedding = embedding / np.linalg.norm(embedding)

        # Convert numpy array to list for Supabase RPC
        embedding_list = embedding[0].tolist()

        # Search in Supabase using RPC function
        params = {
            'query_embedding': embedding_list,
            'match_count': k
        }
        if genre:
            params['filter_genre'] = genre

        result = supabase.rpc('search_albums', params).execute()

        # Format results
        results = []
        for album in result.data:
            results.append({
                "id": album["id"],
                "artist": album.get("artist"),
                "album_name": album.get("album_name"),
                "genre": album.get("genre"),
                "release_year": album.get("release_year"),
                "similarity": float(album.get("similarity", 0)),
                "pitchfork_score": float(album["pitchfork_score"]) if album.get("pitchfork_score") else None,
                "cover_url": album.get("cover_url")
            })

        logger.info(f"Found {len(results)} results for '{query}'")

        return {
            "success": True,
            "query_type": "text",
            "query": query,
            "total_results": len(results),
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search by text failed: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


@app.get("/api/genres")
async def get_genres():
    """
    Get list of available genres in the database.

    Returns:
    - JSON with list of genres sorted alphabetically
    """
    try:
        logger.info("Fetching genres from Supabase...")

        # Query all unique genres from the album_covers table
        result = supabase.table('album_covers')\
            .select('genre')\
            .execute()

        # Extract unique genres and filter out None/empty values
        genres = list(set([row['genre'] for row in result.data if row.get('genre')]))
        genres.sort()

        logger.info(f"Found {len(genres)} unique genres")

        return {
            "success": True,
            "total_genres": len(genres),
            "genres": genres
        }

    except Exception as e:
        logger.error(f"Failed to fetch genres: {e}")
        raise HTTPException(500, f"Failed to fetch genres: {str(e)}")


@app.get("/api/stats")
async def get_stats():
    """
    Get dataset statistics.

    Returns:
    - Total albums
    - Genre distribution (top 10)
    - Year range
    - Average Pitchfork scores
    """
    if not supabase:
        raise HTTPException(500, "Supabase client not initialized")

    try:
        # Get all albums data for statistics
        result = supabase.table('album_covers')\
            .select('genre, release_year, pitchfork_score, best_new_music')\
            .execute()

        albums = result.data
        total_albums = len(albums)

        # Count genres
        genre_counts = {}
        years = []
        scores = []
        bnm_count = 0

        for album in albums:
            # Genre distribution
            genre = album.get("genre", "Unknown")
            genre_counts[genre] = genre_counts.get(genre, 0) + 1

            # Year range
            year = album.get("release_year")
            if year:
                years.append(int(year))

            # Scores
            score = album.get("pitchfork_score")
            if score:
                scores.append(float(score))

            # Best New Music count
            if album.get("best_new_music"):
                bnm_count += 1

        # Top 10 genres
        top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_albums": total_albums,
            "top_genres": [{"genre": g, "count": c} for g, c in top_genres],
            "year_range": {
                "min": min(years) if years else None,
                "max": max(years) if years else None
            },
            "pitchfork_scores": {
                "average": round(sum(scores) / len(scores), 2) if scores else None,
                "min": round(min(scores), 1) if scores else None,
                "max": round(max(scores), 1) if scores else None,
                "best_new_music_count": bnm_count
            }
        }

    except Exception as e:
        logger.error(f"Failed to compute stats: {e}")
        raise HTTPException(500, f"Failed to compute statistics: {str(e)}")


@app.get("/api/search-vlm")
async def search_by_vlm(
    query: str,
    k: int = DEFAULT_K,
    min_similarity: float = 0.0,
    filter_warnings: bool = False,
    genre: Optional[str] = None
):
    """
    Search for album covers using VLM (Vision-Language Model) semantic text search.
    Searches through album cover descriptions for semantic matches.

    Parameters:
    - query: Text query (e.g., "minimalist album cover with bold typography")
    - k: Number of results to return (default: 10, max: 50)
    - min_similarity: Minimum similarity threshold 0-1 (default: 0.0)
    - filter_warnings: Exclude albums with VLM warnings (default: False)
    - genre: Optional genre filter

    Returns:
    - JSON with VLM search results including descriptions
    """
    if not vlm_model:
        raise HTTPException(503, "VLM model not loaded")

    if not query or len(query.strip()) == 0:
        raise HTTPException(400, "Query cannot be empty")

    if k < 1 or k > MAX_K:
        raise HTTPException(400, f"k must be between 1 and {MAX_K}")

    try:
        logger.info(f"VLM search query: '{query}' (k={k}, genre={genre})")

        # Generate VLM text embedding
        embedding = vlm_model.encode(query, convert_to_numpy=True)
        embedding_list = embedding.tolist()

        # Search in Supabase using VLM RPC function
        params = {
            'query_embedding': embedding_list,
            'match_count': k,
            'filter_warnings': filter_warnings
        }
        if genre:
            params['filter_genre'] = genre

        result = supabase.rpc('search_albums_vlm', params).execute()

        # Format results
        results = []
        for album in result.data:
            similarity = float(album.get("similarity", 0))
            if similarity >= min_similarity:
                results.append({
                    "id": album["id"],
                    "artist": album.get("artist"),
                    "album_name": album.get("album_name"),
                    "genre": album.get("genre"),
                    "release_year": album.get("release_year"),
                    "similarity": similarity,
                    "pitchfork_score": float(album["pitchfork_score"]) if album.get("pitchfork_score") else None,
                    "cover_url": album.get("cover_url"),
                    "vlm_description": album.get("vlm_description"),
                    "vlm_warning": album.get("vlm_warning")
                })

        logger.info(f"Found {len(results)} VLM results for '{query}'")

        return {
            "success": True,
            "mode": "vlm",
            "query_type": "text",
            "query": query,
            "total_found": len(results),
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VLM search failed: {e}")
        raise HTTPException(500, f"VLM search failed: {str(e)}")


@app.get("/api/vlm-stats")
async def get_vlm_stats():
    """
    Get VLM coverage statistics.

    Returns:
    - total_albums: Total number of albums in database
    - vlm_albums: Number of albums with VLM descriptions
    - vlm_percentage: Percentage of albums with VLM data
    """
    if not supabase:
        raise HTTPException(500, "Supabase client not initialized")

    try:
        # Count total albums
        total_response = supabase.table('album_covers').select('id', count='exact').limit(1).execute()
        total_albums = total_response.count if hasattr(total_response, 'count') else 0

        # Count VLM-processed albums
        vlm_response = supabase.table('album_covers').select('id', count='exact').eq('vlm_processed', True).execute()
        vlm_albums = vlm_response.count if hasattr(vlm_response, 'count') else 0

        percentage = (vlm_albums / total_albums * 100) if total_albums > 0 else 0

        return {
            "success": True,
            "total_albums": total_albums,
            "vlm_albums": vlm_albums,
            "vlm_percentage": round(percentage, 2)
        }

    except Exception as e:
        logger.error(f"Failed to fetch VLM stats: {e}")
        raise HTTPException(500, f"Failed to fetch VLM stats: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,  # Standard HF Spaces port
        log_level="info"
    )
