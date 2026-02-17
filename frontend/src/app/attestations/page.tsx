'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONTRACT_ADDRESS = '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';
const OPBNB_EXPLORER = 'https://opbnb.bscscan.com';

const RISK_COLORS: Record<string, string> = {
  SAFE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CAUTION: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  DANGER: 'text-red-400 bg-red-500/10 border-red-500/20',
  CRITICAL: 'text-red-500 bg-red-500/15 border-red-500/30',
};

interface TokenAttestation {
  token: string;
  score: number;
  riskLevel: string;
  timestamp: number;
  totalAttestations: number;
}

function formatTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AttestationsPage() {
  const [data, setData] = useState<{ totalScans: number; tokens: TokenAttestation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/attestations')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-8 sm:py-16">
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          On-Chain Attestations
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight">
          <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            On-Chain Proofs
          </span>
        </h1>
        <p className="text-zinc-500 text-sm sm:text-base max-w-lg mx-auto">
          Every VibeCheck scan is permanently recorded on opBNB as an immutable attestation.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <a
            href={`${OPBNB_EXPLORER}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg glass text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View Contract ↗
          </a>
          {data && (
            <span className="text-xs text-zinc-500">
              <span className="text-emerald-500 font-semibold">{data.totalScans.toLocaleString()}</span> total scans
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {data && data.tokens.length > 0 && (() => {
        const avgScore = Math.round(data.tokens.reduce((s, t) => s + t.score, 0) / data.tokens.length);
        const dist = { SAFE: 0, CAUTION: 0, DANGER: 0, CRITICAL: 0 } as Record<string, number>;
        data.tokens.forEach(t => { dist[t.riskLevel] = (dist[t.riskLevel] || 0) + 1; });
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">{data.totalScans.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Total Scans</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-3xl sm:text-4xl font-black" style={{ color: avgScore >= 70 ? '#34d399' : avgScore >= 40 ? '#fbbf24' : '#f87171' }}>{avgScore}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Avg Safety Score</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-emerald-400 font-black text-xl">{dist.SAFE}</span>
                <span className="text-[10px] text-zinc-600">/</span>
                <span className="text-yellow-400 font-black text-xl">{dist.CAUTION}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Safe / Caution</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-400 font-black text-xl">{dist.DANGER}</span>
                <span className="text-[10px] text-zinc-600">/</span>
                <span className="text-red-500 font-black text-xl">{dist.CRITICAL}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Danger / Critical</div>
            </div>
          </div>
        );
      })()}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/10 px-4 py-2 rounded-xl">
            <span>⚠</span> {error}
          </div>
        </div>
      )}

      {data && data.tokens.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">No attestations found yet.</p>
          <Link href="/" className="text-emerald-500 text-sm hover:text-emerald-400 mt-2 inline-block">
            Scan a token to create the first one →
          </Link>
        </div>
      )}

      {data && data.tokens.length > 0 && (
        <div className="space-y-2.5">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <div className="col-span-5">Token</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Risk</div>
            <div className="col-span-3 text-right">Date</div>
          </div>

          {data.tokens.map((t, i) => (
            <Link
              key={`${t.token}-${i}`}
              href={`/?address=${t.token}`}
              className="glass glass-hover rounded-xl px-4 py-3.5 transition-all cursor-pointer group block"
            >
              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <span className="text-lg font-black w-8 text-center shrink-0" style={{
                    color: t.score >= 70 ? '#34d399' : t.score >= 40 ? '#fbbf24' : '#f87171',
                  }}>
                    {t.score}
                  </span>
                  <span className="font-mono text-sm text-zinc-300 group-hover:text-emerald-400 transition-colors truncate">
                    {t.token.slice(0, 6)}...{t.token.slice(-4)}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-zinc-200">{t.score}/100</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase ${RISK_COLORS[t.riskLevel] || RISK_COLORS.CAUTION}`}>
                    {t.riskLevel}
                  </span>
                </div>
                <div className="col-span-3 text-right text-xs text-zinc-500">
                  {formatTime(t.timestamp)}
                </div>
              </div>

              {/* Mobile */}
              <div className="sm:hidden flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-black w-8 text-center shrink-0" style={{
                    color: t.score >= 70 ? '#34d399' : t.score >= 40 ? '#fbbf24' : '#f87171',
                  }}>
                    {t.score}
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono text-sm text-zinc-300 truncate block">
                      {t.token.slice(0, 8)}...{t.token.slice(-6)}
                    </span>
                    <span className="text-[10px] text-zinc-600">{formatTime(t.timestamp)}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold uppercase shrink-0 ${RISK_COLORS[t.riskLevel] || RISK_COLORS.CAUTION}`}>
                  {t.riskLevel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-emerald-500/80 hover:text-emerald-400 transition-colors">
          ← Back to Scanner
        </Link>
      </div>
    </div>
  );
}
