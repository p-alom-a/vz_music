export interface SearchResult {
  id: string;
  artist: string;
  album_name: string;
  genre: string;
  release_year: number | null;
  similarity: number;
  pitchfork_score: number | null;
  cover_url: string;
}

export interface SearchResponse {
  success: boolean;
  query_type: 'image' | 'text';
  query?: string;
  total_results: number;
  results: SearchResult[];
}

export interface ApiError {
  detail: string;
}
