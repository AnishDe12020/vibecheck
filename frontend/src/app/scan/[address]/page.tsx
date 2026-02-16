'use client';

import { useState, useCallback, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import type { VibeCheckReport, ScanStatus, RiskCategory } from '../../../lib/types';
import { TokenLogo } from '../../../components/TokenLogo';
import { HolderChart } from '../../../components/HolderChart';
import { LiquidityPanel } from '../../../components/LiquidityPanel';

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e', SAFE: '#22c55e',
  caution: '#eab308', CAUTION: '#eab308',
  danger: '#f97316', DANGER: '#f97316',
  critical: '#ef4444', CRITICAL: '#ef4444',
};

const RISK_BG: Record<string, string> = {
  safe: 'bg-green-500/10 border-green-500/30 text-green-400 badge-safe',
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400 badge-safe',
  caution: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 badge-caution',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 badge-caution',
  danger: 'bg-orange-500/10 border-orange-500/30 text-orange-400 badge-danger',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400 badge-danger',
  critical: 'bg-red-500/10 border-red-500/30 text-red-400 badge-critical',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400 badge-critical',
};

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📜', concentration: '🏦', liquidity: '💧', trading: '📊',
};

const SCAN_STEPS = [
  { key: 'fetching', label: 'Fetch Data', icon: '📡' },
  { key: 'analyzing', label: 'AI Analysis', icon: '🧠' },
  { key: 'attesting', label: 'Attest', icon: '⛓️' },
];

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ScoreGauge({ score, riskLevel, animate, size = 160 }: {
  score: number; riskLevel: string; animate?: boolean; size?: number;
}) {
  const color = RISK_COLORS[riskLevel] || '#eab308';
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center score-glow ${animate ? 'animate-score-pop' : ''}`}
      style={{ '--glow-color': `${color}40` } as React.CSSProperties}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="grad-score" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}99`} />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} />
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(39,39,42,0.3)" strokeWidth="12" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#grad-score)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={animate ? circumference : offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          filter="url(#shadow)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black tracking-tight" style={{ color }}>{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

function ScanProgressBar({ status }: { status: ScanStatus }) {
  const stepIndex = SCAN_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-2 max-w-md mx-auto mt-6">
      {SCAN_STEPS.map((step, i) => {
        const isActive = step.key === status;
        const isDone = i < stepIndex || status === 'complete';
        return (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500
              ${isDone ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/30' : 'bg-zinc-800/50 text-zinc-600'}
            `}>
              {isDone ? '✓' : step.icon}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-emerald-400' : isDone ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {step.label}
            </span>
            {i < SCAN_STEPS.length - 1 && (
              <div className={`flex-1 h-px transition-all duration-500 ${isDone ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_MESSAGES: Record<string, string> = {
  fetching: 'Fetching on-chain data...',
  analyzing: 'AI is analyzing token safety...',
  attesting: 'Recording on opBNB...',
};

export default function ScanPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [report, setReport] = useState<VibeCheckReport | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<{ name?: string; symbol?: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanStarted = useRef(false);

  const isScanning = status === 'fetching' || status === 'analyzing' || status === 'attesting';

  const handleScan = useCallback(async () => {
    setError(''); setReport(null); setStatus('fetching'); setElapsed(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 100);

    try {
      const res = await fetch(`/api/scan-stream?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/m);
          if (!match) continue;
          try {
            const event = JSON.parse(match[1]);
            if (event.status === 'fetching') setStatus('fetching');
            else if (event.status === 'fetching_done') {
              setTokenPreview({ name: event.tokenName, symbol: event.tokenSymbol });
            } else if (event.status === 'analyzing') setStatus('analyzing');
            else if (event.status === 'attesting') setStatus('attesting');
            else if (event.status === 'complete') {
              setReport(event.data);
              setStatus('complete');
              setScoreAnimating(true);
              setTimeout(() => setScoreAnimating(false), 1500);
            } else if (event.status === 'error') throw new Error(event.error);
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Scan failed');
      setStatus('error');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [address]);

  // Auto-scan on mount
  useEffect(() => {
    if (!scanStarted.current && address.match(/^0x[a-fA-F0-9]{40}$/)) {
      scanStarted.current = true;
      handleScan();
    }
  }, [address, handleScan]);

  return (
    <div className="min-h-screen bg-[#050507] bg-grid flex flex-col">
      {/* Top progress */}
      {isScanning && (
        <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden h-0.5">
          <div className="scan-progress w-full" />
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/30 py-4 px-6 bg-[#050507]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <span className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              VibeCheck
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-800/50">
              ← New Scan
            </Link>
            <Link href="/history" className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-800/50">
              History →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Scanning state */}
        {isScanning && !report && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Scanning token
            </div>

            <h1 className="text-3xl font-black text-zinc-100 mb-2">
              {tokenPreview?.name || 'Token Scan'}
              {tokenPreview?.symbol && <span className="text-zinc-500 font-normal ml-2">({tokenPreview.symbol})</span>}
            </h1>
            <p className="font-mono text-zinc-500 text-sm mb-2">{shortenAddress(address)}</p>

            <ScanProgressBar status={status} />

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm text-emerald-400/80">{STATUS_MESSAGES[status] || ''}</span>
              <span className="text-xs text-zinc-600 font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
            </div>

            {/* Skeleton */}
            <div className="mt-12 space-y-6 max-w-3xl mx-auto">
              <div className="glass rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-[160px] h-[160px] rounded-full shimmer" />
                <div className="flex-1 space-y-4 w-full">
                  <div className="h-8 shimmer rounded-lg w-48" />
                  <div className="h-4 shimmer rounded w-full" />
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-16 shimmer rounded-xl w-full" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="glass rounded-2xl p-6 h-40 shimmer" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center py-16">
            <h1 className="text-3xl font-black text-zinc-100 mb-4">Scan Failed</h1>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => { scanStarted.current = false; handleScan(); }}
              className="bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-bold px-8 py-3 rounded-2xl cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score card */}
            <div className="glass rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
              <ScoreGauge score={report.overallScore} riskLevel={report.riskLevel} animate={scoreAnimating} />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                  <TokenLogo address={report.token.address} size={40} />
                  <h1 className="text-3xl font-black text-zinc-100 tracking-tight">
                    {report.token.name}
                    <span className="text-zinc-500 font-normal ml-2 text-xl">({report.token.symbol})</span>
                  </h1>
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider ${RISK_BG[report.riskLevel]}`}>
                    {report.riskLevel}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-600 mb-3 break-all">{address}</p>
                <p className="text-zinc-400 mb-5 leading-relaxed">{report.summary}</p>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm">
                    <span className="text-zinc-500 font-semibold">💡 Recommendation: </span>
                    <span className="text-zinc-300">{report.recommendation}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="grid md:grid-cols-2 gap-4 stagger-children">
              {(Object.entries(report.categories) as [string, RiskCategory][]).map(([key, cat]) => {
                const color = RISK_COLORS[cat.level] || '#eab308';
                return (
                  <div key={key} className="glass glass-hover rounded-2xl p-6 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-lg">
                          {CATEGORY_ICONS[key] || '📋'}
                        </div>
                        <h3 className="font-semibold text-zinc-100">{cat.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold" style={{ color }}>{cat.score}</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${RISK_BG[cat.level]}`}>
                          {cat.level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-4 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${cat.score}%`, backgroundColor: color }} />
                    </div>
                    <ul className="space-y-2">
                      {cat.findings.map((f, i) => (
                        <li key={i} className="text-sm text-zinc-400 flex items-start gap-2.5 leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Project Intel Card */}
            <div className="glass rounded-3xl p-6 border-emerald-500/10 bg-emerald-500/[0.02] animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> Project Intel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Status</div>
                  <div className={`text-sm font-bold flex items-center gap-1.5 ${report.token.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {report.token.isVerified ? '✅ Verified' : '⚠️ Unverified'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Owner</div>
                  <div className="text-sm font-bold text-zinc-300 truncate font-mono">
                    {report.token.owner ? (
                      <a href={`https://bscscan.com/address/${report.token.owner}`} target="_blank" className="hover:text-emerald-400 transition-colors">
                        {report.token.owner.slice(0, 6)}...{report.token.owner.slice(-4)}
                      </a>
                    ) : 'Renounced'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Supply</div>
                  <div className="text-sm font-bold text-zinc-300">
                    {Math.floor(Number(report.token.totalSupply) / Math.pow(10, report.token.decimals)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Chain</div>
                  <div className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                    <img src="https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png" className="w-3.5 h-3.5" alt="BSC" />
                    BSC
                  </div>
                </div>
              </div>
            </div>

            {/* Data Panels */}
            {(report.topHolders?.length > 0 || report.liquidity?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {report.topHolders?.length > 0 && <HolderChart holders={report.topHolders} />}
                {report.liquidity?.length > 0 && <LiquidityPanel pools={report.liquidity} />}
              </div>
            )}

            {/* Flags */}
            {report.flags.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-zinc-200 mb-4 flex items-center gap-2">
                  <span>🚩</span> Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.flags.map((flag, i) => (
                    <span key={i} className="text-sm px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const text = `🔍 VibeCheck: ${report.token.name} scored ${report.overallScore}/100 — ${report.riskLevel}\n\n${report.summary.slice(0, 180)}\n\nScan any BSC token → vibecheck-bsc.vercel.app/scan/${address}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  𝕏 Share
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  📋 Copy Link
                </button>
                <Link
                  href="/"
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-emerald-400 transition-all flex items-center gap-2"
                >
                  🔍 New scan
                </Link>
              </div>
              {report.attestationTx && (
                <div className="text-xs text-zinc-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Attested on opBNB:{' '}
                  <a
                    href={`https://opbnb.bscscan.com/tx/${report.attestationTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-400 font-mono transition-colors"
                  >
                    {report.attestationTx.slice(0, 10)}...{report.attestationTx.slice(-8)}
                  </a>
                </div>
              )}
              <p className="text-xs text-zinc-600 font-mono">Completed in {elapsed.toFixed(1)}s</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-500">VibeCheck</span>
            <span>•</span>
            <span>AI-powered token safety for BNB Chain</span>
          </div>
          <div className="text-xs text-zinc-600">Not financial advice</div>
        </div>
      </footer>
    </div>
  );
}
