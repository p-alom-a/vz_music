import { SearchResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function searchByText(
  query: string,
  k: number = 5,
  genre?: string,
  yearMin?: number,
  yearMax?: number
): Promise<SearchResponse> {
  let url = `${API_BASE_URL}/api/search-by-text?query=${encodeURIComponent(query)}&k=${k}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }
  if (yearMin !== undefined) {
    url += `&year_min=${yearMin}`;
  }
  if (yearMax !== undefined) {
    url += `&year_max=${yearMax}`;
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

export async function getYearRange(): Promise<{ min_year: number; max_year: number }> {
  const response = await fetch(`${API_BASE_URL}/api/year-range`);

  if (!response.ok) {
    throw new Error('Failed to fetch year range');
  }

  const data = await response.json();
  return { min_year: data.min_year, max_year: data.max_year };
}

export async function searchByImage(
  file: File,
  k: number = 5,
  genre?: string,
  yearMin?: number,
  yearMax?: number
): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append('file', file);

  let url = `${API_BASE_URL}/api/search-by-image?k=${k}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }
  if (yearMin !== undefined) {
    url += `&year_min=${yearMin}`;
  }
  if (yearMax !== undefined) {
    url += `&year_max=${yearMax}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}
