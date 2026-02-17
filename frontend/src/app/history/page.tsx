'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const RISK_BG: Record<string, string> = {
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400 badge-safe',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 badge-caution',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400 badge-danger',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400 badge-critical',
};

const RISK_COLORS: Record<string, string> = {
  SAFE: '#22c55e',
  CAUTION: '#eab308',
  DANGER: '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_BAR_BG: Record<string, string> = {
  SAFE: 'bg-green-500',
  CAUTION: 'bg-yellow-500',
  DANGER: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
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

function ScoreBar({ score, riskLevel }: { score: number; riskLevel: string }) {
  const barColor = RISK_BAR_BG[riskLevel] || 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-sm font-bold tabular-nums w-7 text-right" style={{ color: RISK_COLORS[riskLevel] || '#eab308' }}>
        {score}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
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
    <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="mb-10 hero-glow relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-2">
            Scan History
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base">
            All tokens scanned and attested on-chain via opBNB
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-[72px] shimmer" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tokens.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-zinc-400 mb-6">No scans recorded yet</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Scan Your First Token →
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && tokens.length > 0 && (
          <div className="space-y-2 stagger-children">
            {/* Table header — hidden on small screens */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_100px_80px] gap-4 px-5 py-2 text-[11px] text-zinc-600 uppercase tracking-wider font-semibold">
              <span>Token Address</span>
              <span>Score</span>
              <span className="text-center">Risk</span>
              <span className="text-right">When</span>
            </div>

            {tokens.map((t) => (
              <Link
                key={t.address + t.timestamp}
                href={`/scan/${t.address}`}
                className="glass glass-hover rounded-xl px-5 py-4 transition-all block sm:grid sm:grid-cols-[1fr_140px_100px_80px] sm:gap-4 sm:items-center"
              >
                {/* Address */}
                <span className="font-mono text-zinc-300 text-sm">
                  {shortenAddress(t.address)}
                </span>

                {/* Score bar */}
                <div className="mt-2 sm:mt-0">
                  <ScoreBar score={t.score} riskLevel={t.riskLevel} />
                </div>

                {/* Risk badge */}
                <div className="mt-2 sm:mt-0 sm:text-center">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium inline-block ${RISK_BG[t.riskLevel] || RISK_BG.CAUTION}`}>
                    {t.riskLevel}
                  </span>
                </div>

                {/* Time */}
                <span className="hidden sm:block text-right text-xs text-zinc-500">
                  {timeAgo(t.timestamp)}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && tokens.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Scan New Token →
            </Link>
          </div>
        )}
    </div>
  );
}
