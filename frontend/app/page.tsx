'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MotoListing {
  id: number;
  marca: string;
  modello: string;
  anno: number;
  km: number;
  prezzo: number;
  citta: string;
  likes: number;
  cilindrata: number;
  link_annuncio: string;
  created_at: string;
}

export default function Home() {
  const [listings, setListings] = useState<MotoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgPrice: 0, newToday: 0 });
  const [filter, setFilter] = useState({ marca: '', minPrice: 0, maxPrice: 100000 });

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, []);

  async function fetchListings() {
    const { data, error } = await supabase
      .from('moto_listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setListings(data);
    setLoading(false);
  }

  async function fetchStats() {
    const { count } = await supabase
      .from('moto_listings')
      .select('*', { count: 'exact', head: true });

    const { data: avgData } = await supabase
      .from('moto_listings')
      .select('prezzo');

    const avg = avgData?.reduce((sum, item) => sum + (item.prezzo || 0), 0) / (avgData?.length || 1);

    const { count: newCount } = await supabase
      .from('moto_listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    setStats({ total: count || 0, avgPrice: avg || 0, newToday: newCount || 0 });
  }

  const brands = [...new Set(listings.map(l => l.marca).filter(Boolean))].sort();

  const filteredListings = listings.filter(l => 
    (!filter.marca || l.marca === filter.marca) &&
    (l.prezzo >= filter.minPrice && l.prezzo <= filter.maxPrice)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Grain texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      {/* Gradient accents */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px] animate-pulse-slower" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-sm sticky top-0 z-50 bg-zinc-950/80">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-6xl font-black tracking-tight mb-2 bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Bebas Neue, Impact, sans-serif' }}>
                  MOTOMARKT
                </h1>
                <p className="text-zinc-500 text-sm tracking-[0.2em] uppercase font-semibold">
                  Live Market Scanner
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8">
                <Stat label="Totale" value={stats.total.toLocaleString()} />
                <Stat label="Oggi" value={stats.newToday.toString()} accent />
                <Stat label="Prezzo Medio" value={`€${Math.round(stats.avgPrice).toLocaleString()}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-6 py-8 border-b border-zinc-800/30">
          <div className="flex gap-4 items-center">
            <select 
              value={filter.marca}
              onChange={(e) => setFilter({...filter, marca: e.target.value})}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
            >
              <option value="">Tutte le marche</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <div className="flex gap-2 items-center">
              <input 
                type="number"
                placeholder="Min €"
                value={filter.minPrice || ''}
                onChange={(e) => setFilter({...filter, minPrice: Number(e.target.value) || 0})}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/50"
              />
              <span className="text-zinc-600">—</span>
              <input 
                type="number"
                placeholder="Max €"
                value={filter.maxPrice || ''}
                onChange={(e) => setFilter({...filter, maxPrice: Number(e.target.value) || 100000})}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/50"
              />
            </div>

            <div className="ml-auto text-sm text-zinc-500">
              {filteredListings.length} risultati
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing, i) => (
                <MotoCard key={listing.id} listing={listing} delay={i * 50} />
              ))}
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="text-center py-32 text-zinc-600">
              Nessun annuncio trovato con questi filtri
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.12; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <div className={`text-3xl font-black tabular-nums ${accent ? 'text-red-500' : 'text-zinc-100'}`}>
        {value}
      </div>
      <div className="text-xs text-zinc-600 uppercase tracking-wider font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

function MotoCard({ listing, delay }: { listing: MotoListing; delay: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={listing.link_annuncio}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animation: `fadeIn 0.6s ease-out ${delay}ms both` }}
    >
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-1">
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-1">
                {listing.marca}
              </div>
              <h3 className="text-2xl font-black text-zinc-100 leading-tight mb-1 group-hover:text-red-500 transition-colors">
                {listing.modello}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{listing.anno}</span>
                <span>•</span>
                <span>{listing.km?.toLocaleString()} km</span>
                {listing.cilindrata && (
                  <>
                    <span>•</span>
                    <span>{listing.cilindrata}cc</span>
                  </>
                )}
              </div>
            </div>

            {listing.likes > 0 && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 18.35l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35z"/>
                </svg>
                {listing.likes}
              </div>
            )}
          </div>

          {/* Price & Location */}
          <div className="flex items-end justify-between pt-4 border-t border-zinc-800/50">
            <div>
              <div className="text-3xl font-black text-zinc-100 tabular-nums">
                €{listing.prezzo?.toLocaleString()}
              </div>
              {listing.citta && (
                <div className="text-xs text-zinc-600 mt-1">
                  📍 {listing.citta}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-red-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Vedi annuncio
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </a>
  );
}
