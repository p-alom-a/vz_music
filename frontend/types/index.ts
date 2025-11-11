export interface SearchResult {
  album_id: number;
  artist: string;
  album_name: string;
  genre: string;
  release_year: number | null;
  similarity_score: number;
  pitchfork_score: number | null;
  best_new_music: boolean;
  image_url: string;
  cover_url_original: string;
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
