from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import torch
import faiss
import numpy as np
import json
import os
import io
from typing import List, Dict, Any
import logging

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
device = None
faiss_index = None
metadata = None

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_K = 50
DEFAULT_K = 50
MODELS_DIR = "models"
IMAGES_DIR = "images"


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


def load_faiss_index(path: str):
    """Load FAISS index from file"""
    logger.info(f"Loading FAISS index from {path}...")
    if not os.path.exists(path):
        raise FileNotFoundError(f"FAISS index not found at {path}")
    index = faiss.read_index(path)
    logger.info(f"FAISS index loaded: {index.ntotal} vectors indexed")
    return index


def load_metadata(path: str):
    """Load metadata from JSON file"""
    logger.info(f"Loading metadata from {path}...")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Metadata file not found at {path}")

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    logger.info(f"Metadata loaded: {len(data)} albums")
    return data


def get_album_by_local_id(local_id: int, metadata_list: List[Dict]) -> Dict[str, Any]:
    """Find album by local_id in metadata"""
    for album in metadata_list:
        if album.get("local_id") == local_id:
            return album
    return None


@app.on_event("startup")
async def startup_event():
    """Load models and data at startup"""
    global clip_model, clip_processor, device, faiss_index, metadata

    try:
        # Load CLIP model
        clip_model, clip_processor, device = load_clip_model()

        # Load FAISS index
        index_path = os.path.join(MODELS_DIR, "album_covers.index")
        faiss_index = load_faiss_index(index_path)

        # Load metadata
        metadata_path = os.path.join(MODELS_DIR, "valid_metadata_final.json")
        metadata = load_metadata(metadata_path)

        # Verify integrity
        if len(metadata) != faiss_index.ntotal:
            logger.warning(
                f"Mismatch: {len(metadata)} metadata entries vs {faiss_index.ntotal} FAISS vectors"
            )

        logger.info("=" * 60)
        logger.info("Shazam Visual API is ready!")
        logger.info(f"Total albums indexed: {faiss_index.ntotal}")
        logger.info(f"Device: {device}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise


@app.get("/")
def root():
    """API information endpoint"""
    return {
        "message": "🎵 Shazam Visual - Album Cover Search Engine",
        "status": "running",
        "total_albums": faiss_index.ntotal if faiss_index else 0,
        "endpoints": {
            "search_by_image": "POST /api/search-by-image",
            "search_by_text": "GET /api/search-by-text",
            "get_image": "GET /api/image/{album_id}",
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
        faiss_index is not None,
        metadata is not None
    ])

    response_time = time.time() - start

    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "models_loaded": {
            "clip": clip_model is not None,
            "faiss": faiss_index is not None,
            "metadata": metadata is not None
        },
        "total_albums": faiss_index.ntotal if faiss_index else 0,
        "response_time_ms": round(response_time * 1000, 2)
    }


@app.post("/api/search-by-image")
async def search_by_image(file: UploadFile = File(...), k: int = DEFAULT_K):
    """
    Search for similar album covers by uploading an image.

    Parameters:
    - file: Image file (JPEG, PNG, etc.)
    - k: Number of results to return (default: 10, max: 50)

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

        # Normalize for cosine similarity
        faiss.normalize_L2(embedding)

        # Search in FAISS
        distances, indices = faiss_index.search(embedding, k)

        # Format results
        results = []
        for idx, score in zip(indices[0], distances[0]):
            album = get_album_by_local_id(int(idx), metadata)
            if album:
                results.append({
                    "album_id": album["local_id"],
                    "artist": album["artist"],
                    "album_name": album["album_name"],
                    "genre": album["genre"],
                    "release_year": int(album["release_year"]) if album["release_year"] else None,
                    "similarity_score": float(score),
                    "pitchfork_score": float(album["score"]) if album["score"] else None,
                    "best_new_music": bool(album["best_new_music"]),
                    "image_url": f"/api/image/{album['local_id']}",
                    "cover_url_original": album["cover_url"]
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
async def search_by_text(query: str, k: int = DEFAULT_K):
    """
    Search for album covers by text description.

    Parameters:
    - query: Text description (e.g., "dark ambient music", "red album cover")
    - k: Number of results to return (default: 10, max: 50)

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
        logger.info(f"Text search query: '{query}' (k={k})")

        # Generate CLIP text embedding
        inputs = clip_processor(text=query, return_tensors="pt").to(device)
        with torch.no_grad():
            embedding = clip_model.get_text_features(**inputs).cpu().numpy()

        # Normalize for cosine similarity
        faiss.normalize_L2(embedding)

        # Search in FAISS
        distances, indices = faiss_index.search(embedding, k)

        # Format results
        results = []
        for idx, score in zip(indices[0], distances[0]):
            album = get_album_by_local_id(int(idx), metadata)
            if album:
                results.append({
                    "album_id": album["local_id"],
                    "artist": album["artist"],
                    "album_name": album["album_name"],
                    "genre": album["genre"],
                    "release_year": int(album["release_year"]) if album["release_year"] else None,
                    "similarity_score": float(score),
                    "pitchfork_score": float(album["score"]) if album["score"] else None,
                    "best_new_music": bool(album["best_new_music"]),
                    "image_url": f"/api/image/{album['local_id']}",
                    "cover_url_original": album["cover_url"]
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


@app.get("/api/image/{album_id}")
async def get_image(album_id: int):
    """
    Get album cover image by album ID.

    Parameters:
    - album_id: Local ID of the album

    Returns:
    - JPEG image file
    """
    # Validate album exists in metadata
    album = get_album_by_local_id(album_id, metadata)
    if not album:
        raise HTTPException(404, f"Album with ID {album_id} not found")

    # Construct image path
    image_path = os.path.join(IMAGES_DIR, f"album_{album_id}.jpg")

    # Check if file exists
    if not os.path.exists(image_path):
        raise HTTPException(404, f"Image file not found for album {album_id}")

    # Return image with appropriate headers
    return FileResponse(
        image_path,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "public, max-age=86400"  # Cache for 24 hours
        }
    )


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
    if not metadata:
        raise HTTPException(500, "Metadata not loaded")

    try:
        # Count genres
        genre_counts = {}
        years = []
        scores = []
        bnm_count = 0

        for album in metadata:
            # Genre distribution
            genre = album.get("genre", "Unknown")
            genre_counts[genre] = genre_counts.get(genre, 0) + 1

            # Year range
            year = album.get("release_year")
            if year:
                years.append(int(year))

            # Scores
            score = album.get("score")
            if score:
                scores.append(float(score))

            # Best New Music count
            if album.get("best_new_music"):
                bnm_count += 1

        # Top 10 genres
        top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_albums": len(metadata),
            "total_indexed": faiss_index.ntotal if faiss_index else 0,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,  # Standard HF Spaces port
        log_level="info"
    )
