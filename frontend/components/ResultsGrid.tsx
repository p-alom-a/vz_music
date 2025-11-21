'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchResult } from '@/types';
import Image from 'next/image';

interface ResultsGridProps {
  results: SearchResult[];
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ResultsGrid({ results, hasMore = false, onLoadMore }: ResultsGridProps) {
  // État pour stocker l'album actuellement sélectionné
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll avec IntersectionObserver
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, onLoadMore]);

  // Empêcher le scroll du body quand la modale est ouverte sur mobile
  useEffect(() => {
    if (selectedResult && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedResult]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 px-1">
        Results ({results.length})
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 relative items-start">

        {/* LA GRILLE D'IMAGES - Pleine largeur sur mobile, réduite sur desktop si panneau ouvert */}
        <div className={`transition-all duration-300 ease-in-out w-full ${selectedResult ? 'lg:w-2/3' : ''}`}>
          <div className={`grid gap-4 ${
            selectedResult
              ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}>
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`
                  group relative aspect-square overflow-hidden rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${selectedResult?.id === result.id ? 'ring-4 ring-blue-500 ring-offset-2 z-10' : ''}
                `}
              >
                <Image
                  src={result.cover_url}
                  alt={`${result.album_name} by ${result.artist}`}
                  fill
                  className={`
                    object-cover transition-transform duration-500 
                    ${selectedResult?.id === result.id ? 'scale-105' : 'group-hover:scale-110'}
                  `}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  priority={index < 6}
                />
                {/* Overlay au survol pour indiquer qu'on peut cliquer (optionnel) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </button>
            ))}
          </div>

          {/* Sentinel element for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-neutral-400">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* End message when no more results */}
          {!hasMore && results.length > 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm">
              ✓ All relevant results displayed ({results.length} albums)
            </div>
          )}
        </div>

        {/* PANNEAU DE DÉTAILS - Modale plein écran sur mobile, sidebar sticky sur desktop */}
        {selectedResult && (
          <>
            {/* Backdrop pour mobile */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSelectedResult(null)}
            />

            {/* Panneau de détails */}
            <div className={`
              fixed lg:relative
              inset-x-0 bottom-0 lg:inset-auto
              w-full lg:w-1/3
              max-h-[90vh] lg:max-h-none
              lg:sticky lg:top-8
              z-50 lg:z-auto
              animate-in slide-in-from-bottom lg:slide-in-from-right-4 fade-in
              duration-300
            `}>
              <div className="bg-white rounded-t-3xl lg:rounded-xl border-t lg:border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] lg:max-h-none overflow-y-auto">

                {/* Header du panneau avec bouton fermer */}
                <div className="relative">
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                    aria-label="Close details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Grande image de couverture */}
                  <div className="aspect-square relative bg-gray-100 w-full">
                    <Image
                      src={selectedResult.cover_url}
                      alt={selectedResult.album_name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Contenu détaillé */}
                <div className="p-6 space-y-6">

                  {/* Titres */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                      {selectedResult.album_name}
                    </h3>
                    <p className="text-lg text-blue-600 font-medium">
                      {selectedResult.artist}
                    </p>
                  </div>

                  {/* Grid d'infos */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Year</p>
                      <p className="text-gray-700 font-medium">{selectedResult.release_year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Genre</p>
                      <p className="text-gray-700 font-medium capitalize">
                        {selectedResult.genre ? selectedResult.genre.split('/')[0] : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Score de similarité (plus visuel) */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-700">Visual Match Score</span>
                      <span className="text-xl font-bold text-blue-600">
                        {Math.round(selectedResult.similarity * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${Math.round(selectedResult.similarity * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Based on visual vector analysis of the cover art.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}