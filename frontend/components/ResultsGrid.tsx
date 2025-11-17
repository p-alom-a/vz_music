import { SearchResult, SearchMode } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface ResultsGridProps {
  results: SearchResult[];
  searchMode?: SearchMode;
}

export default function ResultsGrid({ results, searchMode = 'clip' }: ResultsGridProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Results ({results.length})
        {searchMode === 'vlm' && (
          <span className="ml-2 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
            VLM Semantic Search
          </span>
        )}
        {searchMode === 'clip' && (
          <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
            CLIP Visual Search
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((result, index) => (
          <div
            key={result.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow bg-white"
          >
            {/* Album Cover Image */}
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={result.cover_url}
                alt={`${result.album_name} by ${result.artist}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={index < 4}
              />
            </div>

            {/* Album Info */}
            <div className="p-4 space-y-2">
              {/* Artist Name */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Artist</p>
                <p className="font-bold text-gray-900 truncate" title={result.artist}>
                  {result.artist}
                </p>
              </div>

              {/* Album Name */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Album</p>
                <p className="text-sm text-gray-800 truncate" title={result.album_name}>
                  {result.album_name}
                </p>
              </div>

              {/* Genre and Year */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Genre</p>
                  <p className="text-xs text-gray-700 truncate" title={result.genre || 'Unknown'}>
                    {result.genre ? result.genre.split('/')[0] : 'Unknown'}
                  </p>
                </div>
                {result.release_year && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Year</p>
                    <p className="text-xs text-gray-700 font-semibold">
                      {result.release_year}
                    </p>
                  </div>
                )}
              </div>

              {/* Similarity Score */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">Similarity</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        searchMode === 'vlm' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.round(result.similarity * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {Math.round(result.similarity * 100)}%
                  </span>
                </div>
              </div>

              {/* VLM Description (only for VLM mode) */}
              {searchMode === 'vlm' && result.vlm_description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {expandedDescriptions.has(result.id) ? (
                      result.vlm_description
                    ) : (
                      <>
                        {result.vlm_description.length > 150
                          ? `${result.vlm_description.substring(0, 150)}...`
                          : result.vlm_description}
                      </>
                    )}
                  </p>
                  {result.vlm_description.length > 150 && (
                    <button
                      onClick={() => toggleDescription(result.id)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium mt-1"
                    >
                      {expandedDescriptions.has(result.id) ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* VLM Warning (if present) */}
              {searchMode === 'vlm' && result.vlm_warning && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ {result.vlm_warning}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
