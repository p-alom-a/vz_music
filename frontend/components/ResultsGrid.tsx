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
      <h2 className="text-2xl font-bold mb-4">Results ({results.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((result, index) => (
          <div
            key={result.album_id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow bg-white"
          >
            {/* Album Cover Image */}
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={result.cover_url_original}
                alt={`${result.album_name} by ${result.artist}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={index < 4}
              />
              {/* Similarity Badge */}
              <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-md text-sm font-semibold shadow-lg">
                {(result.similarity_score * 100).toFixed(1)}%
              </div>
              {/* Best New Music Badge */}
              {result.best_new_music && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                  BNM
                </div>
              )}
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

              {/* Pitchfork Score */}
              {result.pitchfork_score && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Pitchfork Score</span>
                    <span className="text-sm font-bold text-blue-600">
                      {result.pitchfork_score.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
