import { SearchResult } from '@/types';
import Image from 'next/image';

interface ResultsGridProps {
  results: SearchResult[];
}

export default function ResultsGrid({ results }: ResultsGridProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Results ({results.length})
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
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.round(result.similarity * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {Math.round(result.similarity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
