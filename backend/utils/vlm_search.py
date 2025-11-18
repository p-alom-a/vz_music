from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Optional
import os
from supabase import create_client, Client

class VLMSearchEngine:
    """
    VLM (Vision-Language Model) search engine for semantic text-based album search.
    Uses sentence-transformers for text embeddings and Supabase for vector similarity search.
    """

    def __init__(self, model_name: str = "BAAI/bge-base-en-v1.5"):
        """
        Initialize the VLM search engine with text embedding model and Supabase client.

        Args:
            model_name: HuggingFace model identifier for sentence embeddings
        """
        print(f"🚀 Loading VLM text embedding model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = 768  # BAAI/bge-base-en-v1.5 produces 768-dimensional embeddings

        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY environment variables must be set for VLM search"
            )

        print("🔌 Connecting to Supabase...")
        self.supabase: Client = create_client(supabase_url, supabase_key)

        print(f"✅ VLM Search Engine ready! Embedding dimension: {self.embedding_dim}")

    def encode_text(self, text: str) -> np.ndarray:
        """
        Generate a text embedding using the sentence transformer model.

        Args:
            text: Input text query

        Returns:
            768-dimensional embedding vector
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding

    def search_by_text(
        self,
        query: str,
        limit: int = 10,
        min_similarity: float = 0.0,
        filter_warnings: bool = False,
        genre: Optional[str] = None
    ) -> List[Dict]:
        """
        Search for albums using semantic text search via VLM descriptions.

        Args:
            query: Text search query (e.g., "minimalist album cover with bold typography")
            limit: Maximum number of results to return
            min_similarity: Minimum similarity threshold (0-1)
            filter_warnings: If True, exclude albums with vlm_warning
            genre: Optional genre filter

        Returns:
            List of album results with VLM descriptions and similarity scores
        """
        print(f"🔍 VLM search: '{query}' (limit={limit}, genre={genre})")

        # Generate embedding for the query
        query_embedding = self.encode_text(query)
        query_embedding_list = query_embedding.tolist()

        # Build the RPC call parameters
        rpc_params = {
            "query_embedding": query_embedding_list,
            "match_count": limit,
            "filter_warnings": filter_warnings
        }

        # Add genre filter if specified
        if genre:
            rpc_params["filter_genre"] = genre

        # Call Supabase RPC function for vector similarity search
        try:
            response = self.supabase.rpc(
                "search_albums_vlm",
                rpc_params
            ).execute()

            results = response.data

            if not results:
                print("⚠️ No VLM results found")
                return []

            # Filter by minimum similarity if specified
            if min_similarity > 0:
                results = [r for r in results if r.get('similarity', 0) >= min_similarity]

            print(f"✅ Found {len(results)} VLM results")
            return results

        except Exception as e:
            print(f"❌ VLM search error: {str(e)}")
            raise Exception(f"VLM search failed: {str(e)}")

    def get_vlm_stats(self) -> Dict:
        """
        Get statistics about VLM coverage in the database.

        Returns:
            Dictionary with total albums and VLM-processed albums count
        """
        try:
            # Count total albums
            total_response = self.supabase.table("album_covers").select("id", count="exact").execute()
            total_albums = total_response.count

            # Count VLM-processed albums
            vlm_response = self.supabase.table("album_covers").select(
                "id", count="exact"
            ).eq("vlm_processed", True).execute()
            vlm_albums = vlm_response.count

            percentage = (vlm_albums / total_albums * 100) if total_albums > 0 else 0

            return {
                "total_albums": total_albums,
                "vlm_albums": vlm_albums,
                "vlm_percentage": round(percentage, 2)
            }
        except Exception as e:
            print(f"❌ Error fetching VLM stats: {str(e)}")
            return {
                "total_albums": 0,
                "vlm_albums": 0,
                "vlm_percentage": 0
            }
