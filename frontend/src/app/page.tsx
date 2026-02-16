'use client';

import { useState } from 'react';
import type { VibeCheckReport, ScanStatus, RiskCategory } from '../lib/types';

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e',
  SAFE: '#22c55e',
  caution: '#eab308',
  CAUTION: '#eab308',
  danger: '#f97316',
  DANGER: '#f97316',
  critical: '#ef4444',
  CRITICAL: '#ef4444',
};

const RISK_BG: Record<string, string> = {
  safe: 'bg-green-500/10 border-green-500/30 text-green-400',
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400',
  caution: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  danger: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const STATUS_MESSAGES: Record<ScanStatus, string> = {
  idle: '',
  fetching: 'Fetching on-chain data...',
  analyzing: 'AI is analyzing token safety...',
  attesting: 'Recording attestation on opBNB...',
  complete: 'Scan complete!',
  error: 'Scan failed',
};

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📜',
  concentration: '🏦',
  liquidity: '💧',
  trading: '📊',
};

function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const color = RISK_COLORS[riskLevel] || '#eab308';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

function CategoryCard({ category, icon }: { category: RiskCategory; icon: string }) {
  const color = RISK_COLORS[category.level] || '#eab308';
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-zinc-200">{category.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color }}>{category.score}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RISK_BG[category.level]}`}>
            {category.level.toUpperCase()}
          </span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {category.findings.map((f, i) => (
          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
            <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [report, setReport] = useState<VibeCheckReport | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Enter a valid BSC token address (0x...)');
      return;
    }
    setError('');
    setReport(null);
    setStatus('fetching');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // The API handles fetching + analyzing; we simulate status transitions
      setStatus('analyzing');
      const data: VibeCheckReport = await res.json();
      setReport(data);
      setStatus('complete');
    } catch (err: any) {
      setError(err.message || 'Scan failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              VibeCheck
            </span>
          </div>
          <span className="text-xs text-zinc-600 font-mono">BSC Token Safety Scanner</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Hero + Input */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Is this token safe?
          </h1>
          <p className="text-zinc-500 mb-8 text-lg">
            Paste any BSC token address for an instant AI-powered safety analysis
          </p>

          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="0x... token address"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-lg font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              disabled={status === 'fetching' || status === 'analyzing'}
            />
            <button
              onClick={handleScan}
              disabled={status === 'fetching' || status === 'analyzing'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-8 py-4 rounded-xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed"
            >
              {status === 'fetching' || status === 'analyzing' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Scanning
                </span>
              ) : 'Scan'}
            </button>
          </div>

          {/* Status */}
          {status !== 'idle' && status !== 'complete' && status !== 'error' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 animate-pulse-glow">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              {STATUS_MESSAGES[status]}
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 text-sm">{error}</div>
          )}
        </div>

        {/* Report */}
        {report && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Token Info + Score */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
              <ScoreGauge score={report.overallScore} riskLevel={report.riskLevel} />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                  <h2 className="text-2xl font-bold text-zinc-100">
                    {report.token.name} <span className="text-zinc-500">({report.token.symbol})</span>
                  </h2>
                  <span className={`text-sm px-3 py-1 rounded-full border font-bold ${RISK_BG[report.riskLevel]}`}>
                    {report.riskLevel}
                  </span>
                </div>
                <p className="text-zinc-400 mb-4 leading-relaxed">{report.summary}</p>
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-sm">
                    <span className="text-zinc-500 font-medium">Recommendation: </span>
                    <span className="text-zinc-300">{report.recommendation}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {(Object.entries(report.categories) as [string, RiskCategory][]).map(([key, cat]) => (
                <CategoryCard key={key} category={cat} icon={CATEGORY_ICONS[key] || '📋'} />
              ))}
            </div>

            {/* Flags */}
            {report.flags.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-semibold text-zinc-200 mb-3">🚩 Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {report.flags.map((flag, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attestation */}
            {report.attestationTx && (
              <div className="text-center text-xs text-zinc-600">
                Attested on opBNB:{' '}
                <a
                  href={`https://opbnb.bscscan.com/tx/${report.attestationTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-400 font-mono"
                >
                  {report.attestationTx.slice(0, 10)}...{report.attestationTx.slice(-8)}
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-4 px-6 text-center text-xs text-zinc-600">
        VibeCheck — AI-powered token safety for BNB Smart Chain • Not financial advice
      </footer>
    </div>
  );
}
