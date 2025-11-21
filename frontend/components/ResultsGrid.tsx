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
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, onLoadMore]);

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    if (selectedResult && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedResult]);

  if (results.length === 0) return null;

  return (
    <div className="mt-8 w-full px-4 md:px-8 pb-12">
      <h2 className="text-2xl font-medium text-gray-700 mb-6 tracking-tight">
        Résultats <span className="text-gray-400 ml-2 text-lg font-normal">{results.length}</span>
      </h2>

      <div className="flex flex-col lg:flex-row gap-8 relative items-start">

        {/* --- PARTIE GAUCHE : GRILLE --- */}
        <div className={`transition-all duration-500 ease-in-out w-full ${selectedResult ? 'lg:w-2/3' : ''}`}>
          <div className={`grid gap-4 md:gap-6 ${
            selectedResult
              ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}>
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`
                  group relative aspect-square overflow-hidden rounded-2xl transition-all duration-300 bg-gray-100
                  ${selectedResult?.id === result.id 
                    ? 'ring-4 ring-blue-100 ring-offset-4 ring-offset-white shadow-none z-10 scale-[1.02]' 
                    : 'hover:shadow-lg hover:shadow-gray-200 hover:-translate-y-1 ring-0'}
                `}
              >
                <Image
                  src={result.cover_url}
                  alt={result.album_name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  priority={index < 8}
                />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              </button>
            ))}
          </div>

          {/* Loader Infinite Scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {!hasMore && results.length > 0 && (
            <div className="text-center py-12 text-gray-300 text-sm font-light">
              Tout est chargé
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : DETAIL VIEW (Sidebar Desktop / Bottom Sheet Mobile) --- */}
        {selectedResult && (
          <>
            {/* Backdrop sombre (Mobile uniquement) */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
              onClick={() => setSelectedResult(null)}
            />

            {/* Container Principal */}
            <div className={`
              fixed lg:sticky 
              inset-x-0 bottom-0 lg:inset-auto lg:top-8 
              z-50 lg:z-auto
              w-full lg:w-1/3 lg:min-w-[380px]
              max-h-[85vh] lg:max-h-none
              animate-in slide-in-from-bottom duration-300 lg:duration-500 lg:slide-in-from-right-4 lg:fade-in
            `}>
              
              <div className="bg-white rounded-t-[2rem] lg:rounded-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden h-full flex flex-col">
                
                {/* Header avec Image */}
                <div className="relative flex-shrink-0 p-2 pb-0">
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="absolute top-6 right-6 z-20 p-2 bg-white/80 hover:bg-white text-gray-500 rounded-full shadow-sm backdrop-blur-md transition-all border border-white/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Barre poignée pour mobile (indicateur de swipe) */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full lg:hidden z-20" />

                  <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden shadow-sm bg-gray-50">
                    <Image
                      src={selectedResult.cover_url}
                      alt={selectedResult.album_name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Contenu Scrollable (si le texte est long sur mobile) */}
                <div className="p-6 pt-6 space-y-6 overflow-y-auto overscroll-contain">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold text-gray-800 leading-tight tracking-tight">
                      {selectedResult.album_name}
                    </h3>
                    <p className="text-lg text-blue-500 font-medium">
                      {selectedResult.artist}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                     <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100">
                       {selectedResult.release_year || 'N/A'}
                     </span>
                     <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100 capitalize">
                       {selectedResult.genre ? selectedResult.genre.split('/')[0] : 'Inconnu'}
                     </span>
                  </div>

                  {/* Barre Similarité */}
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500 font-medium">Correspondance visuelle</span>
                      <span className="text-gray-800 font-bold bg-white px-2 py-1 rounded-lg shadow-sm text-xs">
                        {Math.round(selectedResult.similarity * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-300 to-blue-500" 
                        style={{ width: `${Math.round(selectedResult.similarity * 100)}%` }}
                      />
                    </div>
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