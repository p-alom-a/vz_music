from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from utils.search import AlbumSearchEngine

# Initialize FastAPI
app = FastAPI(
    title="Shazam Visual API",
    description="Visual search engine for album covers using CLIP + FAISS",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.railway.app",  # Railway frontend URLs
        "https://*.up.railway.app",  # Railway backend URLs
    ],
    allow_origin_regex=r"https://.*\.railway\.app",  # Regex for Railway domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize search engine at startup
search_engine = None

@app.on_event("startup")
async def startup_event():
    global search_engine
    search_engine = AlbumSearchEngine(
        index_path="models/album_covers.index",
        metadata_path="models/metadata.pkl"
    )

# Routes
@app.get("/")
def root():
    return {
        "message": "🎵 Shazam Visual API",
        "status": "running",
        "endpoints": {
            "search_image": "/api/search-by-image",
            "search_text": "/api/search-by-text",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "total_albums": search_engine.index.ntotal if search_engine else 0
    }

@app.post("/api/search-by-image")
async def search_by_image(file: UploadFile = File(...), k: int = 5):
    """Upload an image to find similar album covers"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    try:
        # Read and open image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Search
        results = search_engine.search_by_image(image, k=k)

        return {
            "success": True,
            "query_type": "image",
            "results": results
        }

    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

@app.get("/api/search-by-text")
async def search_by_text(query: str, k: int = 5):
    """Search by text description (e.g., 'a red album cover with a guitar')"""
    print(f"🔥 ENDPOINT CALLED: query='{query}', k={k}")

    if not query or len(query.strip()) == 0:
        raise HTTPException(400, "Query cannot be empty")

    try:
        print(f"🔥 Calling search_engine.search_by_text...")
        results = search_engine.search_by_text(query, k=k)
        print(f"🔥 Got {len(results)} results, returning response")

        return {
            "success": True,
            "query_type": "text",
            "query": query,
            "results": results
        }

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(500, f"Search failed: {str(e)}")

# Run with: uvicorn main:app --reload --port 8000
