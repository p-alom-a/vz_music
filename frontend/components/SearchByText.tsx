'use client';

import { useState, useEffect } from 'react';
import { searchByText, getGenres, getYearRange } from '@/lib/api';
import { SearchResult } from '@/types';
import ResultsGrid from './ResultsGrid';
import YearRangeFilter from './YearRangeFilter';

export default function SearchByText() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Year range state
  const [minYear, setMinYear] = useState<number>(1960);
  const [maxYear, setMaxYear] = useState<number>(2024);
  const [selectedMinYear, setSelectedMinYear] = useState<number>(1960);
  const [selectedMaxYear, setSelectedMaxYear] = useState<number>(2024);

  // Results count state
  const [resultsCount, setResultsCount] = useState<number>(50);

  // Load genres and year range on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [genreList, yearRange] = await Promise.all([
          getGenres(),
          getYearRange(),
        ]);
        setGenres(genreList);

        if (yearRange.min_year && yearRange.max_year) {
          setMinYear(yearRange.min_year);
          setMaxYear(yearRange.max_year);
          setSelectedMinYear(yearRange.min_year);
          setSelectedMaxYear(yearRange.max_year);
        }
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    };

    loadFilters();
  }, []);

  const handleYearChange = (min: number, max: number) => {
    setSelectedMinYear(min);
    setSelectedMaxYear(max);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchByText(
        query,
        resultsCount,
        selectedGenre || undefined,
        selectedMinYear,
        selectedMaxYear
      );
      // Filter results to show only those with good similarity (>5%)
      const filteredResults = response.results.filter(result => result.similarity > 0.05);
      setResults(filteredResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="text-query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <input
            id="text-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., dark metal album, red album cover..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Genre (Optional)
          </label>
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={loading}
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <YearRangeFilter
          minYear={minYear}
          maxYear={maxYear}
          selectedMinYear={selectedMinYear}
          selectedMaxYear={selectedMaxYear}
          onYearChange={handleYearChange}
          disabled={loading}
        />

        <div>
          <label htmlFor="results-count" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de résultats: {resultsCount}
          </label>
          <input
            id="results-count"
            type="range"
            min="10"
            max="500"
            value={resultsCount}
            onChange={(e) => setResultsCount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            disabled={loading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>500</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ResultsGrid results={results} />
    </div>
  );
}
