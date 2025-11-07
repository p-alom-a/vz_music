import { SearchResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchByText(query: string, k: number = 5): Promise<SearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/search-by-text?query=${encodeURIComponent(query)}&k=${k}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
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
