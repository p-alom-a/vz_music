'use client';

import { useState } from 'react';
import { SearchResult } from '@/types';
import Image from 'next/image';

interface ResultsGridProps {
  results: SearchResult[];
}

export default function ResultsGrid({ results }: ResultsGridProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  if (results.length === 0) {
    return null;
  }

  return (
    // w-full et max-w-none pour s'assurer qu'on prend toute la largeur dispo
    <div className="mt-8 w-full px-2 md:px-6"> 
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Results ({results.length})
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 relative items-start">
        
        {/* PARTIE GAUCHE : GRILLE
           - Moins de colonnes = Images plus grosses.
           - Mobile : grid-cols-2 (deux grosses colonnes) au lieu de 1 pour voir plus de contenu.
        */}
        <div className={`transition-all duration-300 ease-in-out ${selectedResult ? 'w-full lg:w-2/3' : 'w-full'}`}>
          <div className={`grid gap-3 ${
            selectedResult 
              ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3' // Si panneau ouvert : très grosses images (2 ou 3 par ligne)
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' // Si panneau fermé : grandes images (3 à 5 par ligne max)
          }`}>
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`
                  group relative aspect-square overflow-hidden bg-gray-200 focus:outline-none
                  ${selectedResult?.id === result.id ? 'ring-4 ring-blue-500 z-10' : 'hover:z-10'}
                `}
              >
                <Image
                  src={result.cover_url}
                  alt={`${result.album_name} by ${result.artist}`}
                  fill
                  className={`
                    object-cover transition-transform duration-500 
                    ${selectedResult?.id === result.id ? 'scale-110 brightness-110' : 'group-hover:scale-110'}
                  `}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  priority={index < 6}
                />
                {/* Gradient subtil en bas pour détacher l'image si besoin, ou overlay au survol */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </button>
            ))}
          </div>
        </div>

        {/* PARTIE DROITE : SIDEBAR
           - Sticky pour rester visible
           - w-1/3 est un bon compromis, mais on s'assure qu'elle ne soit pas trop petite sur les écrans moyens
        */}
        {selectedResult && (
          <div className="w-full lg:w-1/3 lg:min-w-[350px] lg:sticky lg:top-8 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="bg-white shadow-2xl border border-gray-100 overflow-hidden relative">
              
              {/* Bouton fermer */}
              <button
                onClick={() => setSelectedResult(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Cover Full Width dans la sidebar */}
              <div className="relative w-full aspect-square">
                <Image
                  src={selectedResult.cover_url}
                  alt={selectedResult.album_name}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Gradient overlay pour le texte sur l'image si on voulait, ici on garde le style clean en dessous */}
              </div>

              <div className="p-6 md:p-8 space-y-6 bg-white">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
                    {selectedResult.album_name}
                  </h3>
                  <p className="text-xl text-blue-600 font-medium">
                    {selectedResult.artist}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Year</p>
                    <p className="text-lg text-gray-800 font-semibold">{selectedResult.release_year || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Genre</p>
                    <p className="text-lg text-gray-800 font-semibold capitalize truncate">
                      {selectedResult.genre ? selectedResult.genre.split('/')[0] : '—'}
                    </p>
                  </div>
                </div>

                {/* Similarity Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Visual Match</span>
                    <span className="text-blue-600 font-bold">{Math.round(selectedResult.similarity * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${Math.round(selectedResult.similarity * 100)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}