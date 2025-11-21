"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class AlbumResult(BaseModel):
    """Album search result with similarity score."""
    id: str
    artist: Optional[str] = None
    album_name: Optional[str] = None
    genre: Optional[str] = None
    release_year: Optional[int] = None
    similarity: float
    pitchfork_score: Optional[float] = None
    cover_url: Optional[str] = None


class SearchResponse(BaseModel):
    """Standard search response format."""
    success: bool = True
    query_type: str
    total_results: int
    results: List[AlbumResult]
    query: Optional[str] = None  # For text searches


class GenresResponse(BaseModel):
    """Genres listing response."""
    success: bool = True
    total_genres: int
    genres: List[str]


class YearRangeResponse(BaseModel):
    """Year range response."""
    success: bool = True
    min_year: Optional[int] = None
    max_year: Optional[int] = None


class GenreStats(BaseModel):
    """Genre statistics."""
    genre: str
    count: int


class YearRange(BaseModel):
    """Year range information."""
    min: Optional[int] = None
    max: Optional[int] = None


class PitchforkScores(BaseModel):
    """Pitchfork score statistics."""
    average: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    best_new_music_count: int = 0


class StatsResponse(BaseModel):
    """Dataset statistics response."""
    total_albums: int
    top_genres: List[GenreStats]
    year_range: YearRange
    pitchfork_scores: PitchforkScores
