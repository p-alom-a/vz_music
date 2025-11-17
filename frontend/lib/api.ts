import { SearchResponse, VLMStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchByText(query: string, k: number = 5, genre?: string): Promise<SearchResponse> {
  let url = `${API_BASE_URL}/api/search-by-text?query=${encodeURIComponent(query)}&k=${k}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

export async function getGenres(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/genres`);

  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }

  const data = await response.json();
  return data.genres;
}

export async function searchByImage(file: File, k: number = 5): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/search-by-image?k=${k}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

export async function searchByVLM(
  query: string,
  k: number = 10,
  minSimilarity: number = 0.0,
  filterWarnings: boolean = false,
  genre?: string
): Promise<SearchResponse> {
  let url = `${API_BASE_URL}/api/search-vlm?query=${encodeURIComponent(query)}&k=${k}&min_similarity=${minSimilarity}&filter_warnings=${filterWarnings}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'VLM search failed');
  }

  return response.json();
}

export async function getVLMStats(): Promise<VLMStats> {
  const response = await fetch(`${API_BASE_URL}/api/vlm-stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch VLM stats');
  }

  return response.json();
}
