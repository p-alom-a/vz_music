'use client';

import { useState, useEffect } from 'react';
import { searchByText, searchByVLM, getGenres, getVLMStats } from '@/lib/api';
import { SearchResult, SearchMode, VLMStats } from '@/types';
import ResultsGrid from './ResultsGrid';

export default function SearchByText() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('clip');
  const [vlmStats, setVlmStats] = useState<VLMStats | null>(null);

  // Load genres and VLM stats on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreList = await getGenres();
        setGenres(genreList);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    };

    const loadVLMStats = async () => {
      try {
        const stats = await getVLMStats();
        setVlmStats(stats);
      } catch (err) {
        console.error('Failed to load VLM stats:', err);
      }
    };

    loadGenres();
    loadVLMStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (searchMode === 'clip') {
        // CLIP text search (existing)
        response = await searchByText(
          query,
          50,
          selectedGenre || undefined
        );
        // Filter results to show only those with good similarity (>15%)
        const filteredResults = response.results.filter(result => result.similarity > 0.15);
        setResults(filteredResults);
      } else if (searchMode === 'vlm') {
        // VLM semantic search (new)
        response = await searchByVLM(
          query,
          50,
          0.0,
          false,
          selectedGenre || undefined
        );
        setResults(response.results);
      } else if (searchMode === 'hybrid') {
        // Hybrid mode - coming soon
        setError('Hybrid mode coming soon! Please use CLIP or VLM mode.');
        setResults([]);
        return;
      }
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
        {/* Search Mode Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Search Mode
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSearchMode('clip')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                searchMode === 'clip'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              <div className="font-semibold">CLIP</div>
              <div className="text-xs mt-1">Visual Search</div>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('vlm')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                searchMode === 'vlm'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              <div className="font-semibold">VLM</div>
              <div className="text-xs mt-1">Semantic Search</div>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('hybrid')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                searchMode === 'hybrid'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              <div className="font-semibold">Hybrid</div>
              <div className="text-xs mt-1">Coming Soon</div>
            </button>
          </div>
          {/* VLM Stats Indicator */}
          {searchMode === 'vlm' && vlmStats && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              VLM Coverage: {vlmStats.vlm_albums.toLocaleString()}/{vlmStats.total_albums.toLocaleString()} albums ({vlmStats.vlm_percentage}%)
            </div>
          )}
        </div>

        <div>
          <label htmlFor="text-query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <input
            id="text-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === 'clip'
                ? "e.g., dark metal album, red album cover..."
                : "e.g., minimalist album cover with bold typography, dark moody atmosphere..."
            }
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

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            searchMode === 'vlm' ? 'Generating semantic embedding...' : 'Searching...'
          ) : (
            'Search'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ResultsGrid results={results} searchMode={searchMode} />
    </div>
  );
}
