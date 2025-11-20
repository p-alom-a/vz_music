'use client';

import { useState, useEffect } from 'react';
import { searchByText, getGenres, getYearRange } from '@/lib/api';
import { SearchResult } from '@/types';
import ResultsGrid from './ResultsGrid';
import YearRangeFilter from './YearRangeFilter';
import { Search, SlidersHorizontal, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function SearchByText() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Year range state
  const [minYear, setMinYear] = useState<number>(1960);
  const [maxYear, setMaxYear] = useState<number>(2024);
  const [selectedMinYear, setSelectedMinYear] = useState<number>(1960);
  const [selectedMaxYear, setSelectedMaxYear] = useState<number>(2024);

  const [resultsCount, setResultsCount] = useState<number>(50);

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
    if (!query.trim()) return;

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
    <div className="w-full">
      {/* Search Box Container */}
      <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl ring-1 ring-black/20">
        <div className="p-5 sm:p-7">
          <form onSubmit={handleSearch} className="space-y-6">
            
            {/* Main Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 transition-colors ${loading ? 'text-white animate-pulse' : 'text-neutral-500 group-focus-within:text-white'}`} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe the cover (e.g., geometric shapes, red face, dark forest...)"
                className="block w-full pl-12 pr-12 py-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl text-white placeholder-neutral-600 focus:ring-2 focus:ring-white/10 focus:border-white/20 focus:bg-neutral-950 transition-all text-lg"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button 
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl transition-all duration-200 ${showFilters ? 'bg-white text-black' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                  title="Toggle Filters"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Collapsible Filters Area */}
            <div className={`space-y-6 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showFilters ? 'max-h-[600px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Genre Filter */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Genre</label>
                  <div className="relative">
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-neutral-200 focus:ring-2 focus:ring-white/10 focus:border-white/20 appearance-none cursor-pointer hover:bg-neutral-800 transition-colors"
                      disabled={loading}
                    >
                      <option value="">All Genres</option>
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-neutral-500"></div>
                    </div>
                  </div>
                </div>

                {/* Results Count Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Density</label>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-neutral-300">{resultsCount} items</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={resultsCount}
                    onChange={(e) => setResultsCount(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neutral-200"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Year Filter Wrapper */}
              <div className="bg-neutral-950/30 p-5 rounded-2xl border border-white/5">
                 <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Time Period</p>
                 {/* Ensure YearRangeFilter uses text-neutral-200 for text and neutral-700 for slider tracks */}
                 <YearRangeFilter
                  minYear={minYear}
                  maxYear={maxYear}
                  selectedMinYear={selectedMinYear}
                  selectedMaxYear={selectedMaxYear}
                  onYearChange={handleYearChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full group relative overflow-hidden bg-white text-black font-semibold py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-neutral-200 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    Search Albums
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid Area */}
      <div className="mt-16">
        <ResultsGrid results={results} />
      </div>
    </div>
  );
}