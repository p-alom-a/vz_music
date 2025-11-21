"""
Search service for album similarity search using embeddings.
"""
import numpy as np
from typing import List, Dict, Any, Optional
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """Service for searching similar albums using vector embeddings."""

    def __init__(self, supabase_client: Client):
        """
        Initialize search service with Supabase client.

        Args:
            supabase_client: Initialized Supabase client
        """
        self.supabase = supabase_client

    def search_similar_albums(
        self,
        embedding: np.ndarray,
        k: int,
        genre: Optional[str] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar albums using embedding vector.

        Args:
            embedding: Normalized embedding vector (512-dimensional)
            k: Number of results to return
            genre: Optional genre filter
            year_min: Optional minimum release year
            year_max: Optional maximum release year

        Returns:
            List of album dictionaries with similarity scores
        """
        # Convert numpy array to list for Supabase RPC
        embedding_list = embedding.tolist()

        # Build RPC parameters
        params = {
            'query_embedding': embedding_list,
            'match_count': k
        }

        if genre:
            params['filter_genre'] = genre
        if year_min is not None:
            params['filter_year_min'] = year_min
        if year_max is not None:
            params['filter_year_max'] = year_max

        # Execute search via Supabase RPC
        result = self.supabase.rpc('search_albums', params).limit(k).execute()

        logger.info(f"Supabase returned {len(result.data)} results (requested k={k})")

        # Format results
        return self._format_results(result.data)

    def _format_results(self, raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format raw Supabase results into consistent API response format.

        Args:
            raw_results: Raw results from Supabase

        Returns:
            Formatted results list
        """
        formatted = []
        for album in raw_results:
            formatted.append({
                "id": album["id"],
                "artist": album.get("artist"),
                "album_name": album.get("album_name"),
                "genre": album.get("genre"),
                "release_year": album.get("release_year"),
                "similarity": float(album.get("similarity", 0)),
                "pitchfork_score": float(album["pitchfork_score"]) if album.get("pitchfork_score") else None,
                "cover_url": album.get("cover_url")
            })
        return formatted

    def get_all_genres(self) -> List[str]:
        """
        Get all unique genres from the database.

        Returns:
            Sorted list of genre names
        """
        result = self.supabase.table('album_covers').select('genre').execute()
        genres = list(set([row['genre'] for row in result.data if row.get('genre')]))
        genres.sort()
        return genres

    def get_stats(self) -> Dict[str, Any]:
        """
        Get dataset statistics.

        Returns:
            Dictionary with statistics (total albums, top genres, year range, scores)
        """
        result = self.supabase.table('album_covers')\
            .select('genre, release_year, pitchfork_score, best_new_music')\
            .execute()

        albums = result.data
        total_albums = len(albums)

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

    def get_album_count(self) -> int:
        """
        Get total number of albums in database.

        Returns:
            Total album count
        """
        try:
            count_response = self.supabase.table('album_covers').select('id', count='exact').limit(1).execute()
            return count_response.count if hasattr(count_response, 'count') else 0
        except:
            return 0
