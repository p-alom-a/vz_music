"""
Shazam Visual - Album Cover Search Engine API
Visual similarity search using CLIP embeddings and Supabase vector search.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from PIL import Image
import io
import logging
from typing import Optional

from config import MAX_FILE_SIZE, MAX_K, DEFAULT_K, CLIP_MODEL_NAME, init_supabase
from services.clip_service import CLIPService
from services.search_service import SearchService
from models.schemas import SearchResponse, GenresResponse, YearRangeResponse, StatsResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Shazam Visual - Album Cover Search Engine",
    description="Visual similarity search for album covers using CLIP embeddings",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services (initialized at startup)
clip_service: Optional[CLIPService] = None
search_service: Optional[SearchService] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services at startup."""
    global clip_service, search_service

    try:
        # Initialize CLIP service
        clip_service = CLIPService(model_name=CLIP_MODEL_NAME)

        # Initialize Supabase and search service
        supabase_client = init_supabase()
        search_service = SearchService(supabase_client)

        # Log startup info
        total_albums = search_service.get_album_count()
        logger.info("=" * 60)
        logger.info("Shazam Visual API is ready!")
        logger.info(f"Total albums indexed: {total_albums}")
        logger.info(f"Device: {clip_service.device}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise


@app.get("/")
def root():
    """Redirect to frontend."""
    return RedirectResponse(url="https://vzmusic.vercel.app/")


@app.get("/health")
def health():
    """Health check endpoint."""
    import time
    start = time.time()

    is_healthy = clip_service is not None and search_service is not None
    total_albums = search_service.get_album_count() if search_service else 0
    response_time = time.time() - start

    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "models_loaded": {
            "clip": clip_service is not None,
            "search_service": search_service is not None
        },
        "total_albums": total_albums,
        "response_time_ms": round(response_time * 1000, 2)
    }


@app.post("/api/search-by-image", response_model=SearchResponse)
async def search_by_image(
    file: UploadFile = File(...),
    k: int = DEFAULT_K,
    genre: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None
):
    """
    Search for similar album covers by uploading an image.

    Parameters:
    - file: Image file (JPEG, PNG, etc.)
    - k: Number of results to return (default: 50, max: 500)
    - genre: Optional genre filter (e.g., "Rock", "Electronic")
    - year_min: Optional minimum release year filter
    - year_max: Optional maximum release year filter

    Returns:
    - JSON with similar albums ranked by similarity
    """
    if k < 1 or k > MAX_K:
        raise HTTPException(400, f"k must be between 1 and {MAX_K}")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    try:
        # Read and validate image
        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(413, f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)")

        # Convert to RGB image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Generate embedding using CLIP service
        embedding = clip_service.generate_image_embedding(image)

        # Search using search service
        results = search_service.search_similar_albums(
            embedding=embedding,
            k=k,
            genre=genre,
            year_min=year_min,
            year_max=year_max
        )

        logger.info(f"[IMAGE SEARCH] Returning {len(results)} results")

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


@app.get("/api/search-by-text", response_model=SearchResponse)
async def search_by_text(
    query: str,
    k: int = DEFAULT_K,
    genre: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None
):
    """
    Search for album covers by text description.

    Parameters:
    - query: Text description (e.g., "dark ambient music", "red album cover")
    - k: Number of results to return (default: 50, max: 500)
    - genre: Optional genre filter (e.g., "Rock", "Electronic")
    - year_min: Optional minimum release year filter
    - year_max: Optional maximum release year filter

    Returns:
    - JSON with similar albums ranked by similarity
    """
    if not query or len(query.strip()) == 0:
        raise HTTPException(400, "Query cannot be empty")

    if k < 1 or k > MAX_K:
        raise HTTPException(400, f"k must be between 1 and {MAX_K}")

    try:
        logger.info(f"[TEXT SEARCH] Query: '{query}' (k={k}, genre={genre})")

        # Generate embedding using CLIP service
        embedding = clip_service.generate_text_embedding(query)

        # Search using search service
        results = search_service.search_similar_albums(
            embedding=embedding,
            k=k,
            genre=genre,
            year_min=year_min,
            year_max=year_max
        )

        logger.info(f"[TEXT SEARCH] Returning {len(results)} results")

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


@app.get("/api/genres", response_model=GenresResponse)
async def get_genres():
    """
    Get list of available genres in the database.

    Returns:
    - JSON with list of genres sorted alphabetically
    """
    try:
        genres = search_service.get_all_genres()
        logger.info(f"Found {len(genres)} unique genres")

        return {
            "success": True,
            "total_genres": len(genres),
            "genres": genres
        }

    except Exception as e:
        logger.error(f"Failed to fetch genres: {e}")
        raise HTTPException(500, f"Failed to fetch genres: {str(e)}")


@app.get("/api/year-range", response_model=YearRangeResponse)
async def get_year_range():
    """
    Get the minimum and maximum release years available in the database.

    Returns:
    - JSON with min_year and max_year
    """
    try:
        logger.info("Fetching year range from Supabase...")
        stats = search_service.get_stats()
        year_range = stats["year_range"]

        logger.info(f"Year range: {year_range['min']} - {year_range['max']}")

        return {
            "success": True,
            "min_year": year_range["min"],
            "max_year": year_range["max"]
        }

    except Exception as e:
        logger.error(f"Failed to fetch year range: {e}")
        raise HTTPException(500, f"Failed to fetch year range: {str(e)}")


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get dataset statistics.

    Returns:
    - Total albums
    - Genre distribution (top 10)
    - Year range
    - Average Pitchfork scores
    """
    try:
        stats = search_service.get_stats()
        return stats

    except Exception as e:
        logger.error(f"Failed to compute stats: {e}")
        raise HTTPException(500, f"Failed to compute statistics: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,
        log_level="info"
    )
