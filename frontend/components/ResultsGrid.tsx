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

  // Bloquer le scroll du body uniquement sur mobile
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
    <div className="mt-8 w-full px-4 md:px-8 pb-12 relative">
      <h2 className="text-2xl font-medium text-gray-700 mb-6 tracking-tight">
        Résultats <span className="text-gray-400 ml-2 text-lg font-normal">{results.length}</span>
      </h2>

      <div className="flex flex-col items-start">

        {/* --- PARTIE GAUCHE : GRILLE --- */}
        {/* Transition de marge : 
            Quand le panneau est ouvert, on ajoute une marge énorme à droite (lg:mr-[400px])
            pour laisser la place au panneau FIXED sans que la grille ne passe dessous.
        */}
        <div className={`
            w-full transition-all duration-300 ease-in-out
            ${selectedResult ? 'lg:mr-[420px] lg:w-[calc(100%-420px)]' : ''}
        `}>
          <div className={`grid gap-4 md:gap-6 ${
            selectedResult
              ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3' // Si panneau ouvert
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' // Si panneau fermé
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

        {/* --- PARTIE DROITE / MOBILE MODAL --- */}
        {selectedResult && (
          <>
            {/* BACKDROP (Mobile Only) */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
              onClick={() => setSelectedResult(null)}
            />

            {/* CONTAINER DU DÉTAIL */}
            <div className={`
              /* MOBILE: Card Flottante */
              fixed z-50 
              left-4 right-4 bottom-6        /* Marges autour pour l'effet flottant */
              max-h-[75vh]                   /* Moins haut pour voir qu'on est sur une page */
              bg-white 
              rounded-3xl                    /* Gros border radius partout */
              shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]
              overflow-hidden flex flex-col
              animate-in slide-in-from-bottom-10 duration-300

              /* DESKTOP: Sidebar Fixe */
              lg:fixed lg:inset-auto lg:top-6 lg:bottom-6 lg:right-6 
              lg:w-[380px] lg:max-h-none lg:h-auto
              lg:rounded-[2rem] lg:shadow-2xl lg:border lg:border-gray-100
              lg:animate-in lg:slide-in-from-right-10 lg:fade-in lg:duration-300
            `}>
              
              {/* HEADER AVEC BOUTON FERMER (Flottant par dessus le scroll) */}
              <button
                onClick={() => setSelectedResult(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white text-gray-500 rounded-full shadow-md backdrop-blur-md transition-all border border-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* CONTENU SCROLLABLE (Image + Texte ensemble) */}
              <div className="overflow-y-auto overscroll-contain h-full bg-white">
                
                {/* IMAGE (Dans le flux du scroll) */}
                <div className="relative w-full aspect-square bg-gray-50">
                  <Image
                    src={selectedResult.cover_url}
                    alt={selectedResult.album_name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Petit dégradé en bas de l'image pour la transition vers le texte */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/50 to-transparent lg:hidden" />
                </div>

                {/* TEXTE */}
                <div className="p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold text-gray-900 leading-tight">
                      {selectedResult.album_name}
                    </h3>
                    <p className="text-lg text-blue-600 font-medium">
                      {selectedResult.artist}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                     <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100">
                       {selectedResult.release_year || 'N/A'}
                     </span>
                     <span className="px-4 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100 capitalize">
                       {selectedResult.genre ? selectedResult.genre.split('/')[0] : 'Inconnu'}
                     </span>
                  </div>

                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
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

                  {/* Espace vide pour le confort de scroll sur mobile */}
                  <div className="h-8" />
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}