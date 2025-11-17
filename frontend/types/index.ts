export type SearchMode = 'clip' | 'vlm' | 'hybrid';

export interface SearchResult {
  id: string;
  artist: string;
  album_name: string;
  genre: string;
  release_year: number | null;
  similarity: number;
  pitchfork_score: number | null;
  cover_url: string;
  // VLM-specific fields
  vlm_description?: string;
  vlm_warning?: string;
  vlm_processed?: boolean;
}

export interface SearchResponse {
  success: boolean;
  mode?: SearchMode;
  query_type: 'image' | 'text';
  query?: string;
  total_results?: number;
  total_found?: number;
  results: SearchResult[];
}

export interface VLMStats {
  success: boolean;
  total_albums: number;
  vlm_albums: number;
  vlm_percentage: number;
}

export interface ApiError {
  detail: string;
}
