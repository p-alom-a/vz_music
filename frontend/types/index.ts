export interface SearchResult {
  album_id: number;
  genre_id: number;
  similarity_score: number;
}

export interface SearchResponse {
  success: boolean;
  query_type: 'image' | 'text';
  query?: string;
  results: SearchResult[];
}

export interface ApiError {
  detail: string;
}
