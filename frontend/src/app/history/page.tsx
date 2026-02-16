'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const RISK_BG: Record<string, string> = {
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const RISK_COLORS: Record<string, string> = {
  SAFE: '#22c55e',
  CAUTION: '#eab308',
  DANGER: '#f97316',
  CRITICAL: '#ef4444',
};

interface TokenScore {
  address: string;
  score: number;
  riskLevel: string;
  timestamp: number;
}

function timeAgo(ts: number): string {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function HistoryPage() {
  const [tokens, setTokens] = useState<TokenScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setTokens(d.tokens || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <header className="border-b border-zinc-800/50 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🔍</span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              VibeCheck
            </span>
          </Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Back to Scanner
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-2">
            On-Chain Scan History
          </h1>
          <p className="text-zinc-500">Recent tokens scanned and attested on opBNB</p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {!loading && !error && tokens.length === 0 && (
          <div className="text-center text-zinc-500 py-12">No scans found yet.</div>
        )}

        {!loading && tokens.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 px-5 py-2 text-xs text-zinc-600 uppercase tracking-wider font-semibold">
              <span>Token Address</span>
              <span className="text-center">Score</span>
              <span className="text-center">Risk</span>
              <span className="text-right">Scanned</span>
            </div>
            {tokens.map((t) => (
              <Link
                key={t.address + t.timestamp}
                href={`/?address=${t.address}`}
                className="grid grid-cols-[1fr_80px_100px_100px] gap-4 items-center bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-700 transition-all"
              >
                <span className="font-mono text-zinc-300 text-sm">{shortenAddress(t.address)}</span>
                <span className="text-center text-lg font-bold" style={{ color: RISK_COLORS[t.riskLevel] || '#eab308' }}>
                  {t.score}
                </span>
                <span className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RISK_BG[t.riskLevel] || RISK_BG.CAUTION}`}>
                    {t.riskLevel}
                  </span>
                </span>
                <span className="text-right text-xs text-zinc-500">{timeAgo(t.timestamp)}</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/50 py-4 px-6 text-center text-xs text-zinc-600">
        VibeCheck — AI-powered token safety for BNB Smart Chain
      </footer>
    </div>
  );
}
