'use client';

import { useState } from 'react';
import SearchByText from '@/components/SearchByText';
import SearchByImage from '@/components/SearchByImage';

type TabType = 'text' | 'image';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('text');

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Shazam Visual
          </h1>
          <p className="text-lg text-gray-600">
            Search for album covers using images or text descriptions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'text'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search by Text
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'image'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search by Image
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'text' ? <SearchByText /> : <SearchByImage />}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by CLIP + FAISS | 20,000 albums indexed</p>
        </div>
      </div>
    </main>
  );
}
