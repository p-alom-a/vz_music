import { SearchResult } from '@/types';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Album ID
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {result.album_id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Genre ID
                </span>
                <span className="text-md text-gray-800">
                  {result.genre_id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">
                  Similarity
                </span>
                <span className="text-md font-semibold text-green-600">
                  {(result.similarity_score * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
