'use client';

import SearchByText from '@/components/SearchByText';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Search for album covers using text descriptions
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Powered by CLIP + HNSW index | 25,000+ albums indexed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <SearchByText />
        </div>
      </div>
    </main>
  );
}
