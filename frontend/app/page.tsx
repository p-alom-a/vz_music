'use client';

import SearchByText from '@/components/SearchByText';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Spot<span className="text-blue-600">It</span>
          </h1>
          <p className="text-lg text-gray-600">
            Search for album covers using text descriptions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <SearchByText />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by CLIP + Supabase | 25,000+ albums indexed</p>
        </div>
      </div>
    </main>
  );
}
