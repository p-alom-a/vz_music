'use client';

import SearchByText from '@/components/SearchByText';
import { Disc } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 relative overflow-hidden selection:bg-white/20">
      {/* Subtle Neutral Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center p-2 px-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
            <Disc className="w-4 h-4 text-neutral-300 mr-2 animate-spin-slow" />
            <span className="text-xs font-medium text-neutral-300 tracking-widest uppercase">
              AI Powered Search
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4">
            Find albums by <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              visual description
            </span>
          </h1>
          
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
            Forget the artist name. Describe the artwork, colors, or mood.
            Our <span className="text-white font-medium">CLIP + HNSW</span> engine scans over 25,000 albums to match your vibe.
          </p>
        </div>

        {/* Main Container */}
        <div className="relative z-10">
          <SearchByText />
        </div>
      </div>
    </main>
  );
}