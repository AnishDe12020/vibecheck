'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { VibeCheckReport, ScanStatus, RiskCategory } from '../lib/types';
import { TokenLogo } from '../components/TokenLogo';
import { HolderChart } from '../components/HolderChart';
import { LiquidityPanel } from '../components/LiquidityPanel';

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

const STATUS_MESSAGES: Record<ScanStatus, string> = {
  idle: '',
  fetching: 'Fetching on-chain data...',
  analyzing: 'AI is analyzing token safety...',
  attesting: 'Recording on opBNB...',
  complete: 'Scan complete!',
  error: 'Scan failed',
};

const SCAN_STEPS = [
  { key: 'fetching', label: 'Fetch Data', icon: '📡' },
  { key: 'analyzing', label: 'AI Analysis', icon: '🧠' },
  { key: 'attesting', label: 'Attest', icon: '⛓️' },
];

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📜', concentration: '🏦', liquidity: '💧', trading: '📊',
};

const EXAMPLE_TOKENS = [
  { name: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', label: 'Safe', color: 'text-green-400' },
  { name: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', label: 'Safe', color: 'text-green-400' },
  { name: 'SafeMoon', address: '0x8076C74C5e3F5852037F31Ff0093Eeb8c8ADd8D3', label: 'Risky', color: 'text-yellow-400' },
  { name: 'Squid Game', address: '0x87230146E138d3F296a9a77e497A2A83012e9Bc5', label: 'Scam', color: 'text-red-400' },
];

const STORAGE_KEY = 'vibecheck_recent_scans';

interface RecentScan {
  address: string;
  name: string;
  symbol: string;
  score: number;
  riskLevel: string;
  timestamp: number;
  report: VibeCheckReport;
}

function getRecentScans(): RecentScan[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveRecentScan(report: VibeCheckReport) {
  const scans = getRecentScans();
  const entry: RecentScan = {
    address: report.token.address,
    name: report.token.name,
    symbol: report.token.symbol,
    score: report.overallScore,
    riskLevel: report.riskLevel,
    timestamp: Date.now(),
    report,
  };
  const filtered = scans.filter(s => s.address.toLowerCase() !== entry.address.toLowerCase());
  const updated = [entry, ...filtered].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ---------- COMPONENTS ---------- */

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

function CategoryCard({ category, icon, delay }: { category: RiskCategory; icon: string; delay?: number }) {
  const color = RISK_COLORS[category.level] || '#eab308';
  return (
    <div
      className="glass glass-hover rounded-2xl p-6 transition-all duration-300"
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-lg">
            {icon}
          </div>
          <h3 className="font-semibold text-zinc-100">{category.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color }}>{category.score}</span>
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${RISK_BG[category.level]}`}>
            {category.level.toUpperCase()}
          </span>
        </div>
      </div>
      {/* Mini score bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${category.score}%`, backgroundColor: color }}
        />
      </div>
      <ul className="space-y-2">
        {category.findings.map((f, i) => (
          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2.5 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {f}
          </li>
        ))}
      </ul>
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

function SkeletonReport({ tokenName, tokenSymbol }: { tokenName?: string; tokenSymbol?: string }) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-[160px] h-[160px] rounded-full shimmer" />
        <div className="flex-1 space-y-4 w-full">
          {tokenName ? (
            <h2 className="text-2xl font-bold text-zinc-100">
              {tokenName} <span className="text-zinc-500">({tokenSymbol})</span>
            </h2>
          ) : (
            <div className="h-8 shimmer rounded-lg w-48" />
          )}
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
  );
}

/* ---------- MAIN PAGE ---------- */

function HomeInner() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [report, setReport] = useState<VibeCheckReport | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [tokenPreview, setTokenPreview] = useState<{ name?: string; symbol?: string } | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [totalScans, setTotalScans] = useState<number | null>(null);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecentScans(getRecentScans());
    fetch('/api/total-scans').then(r => r.json()).then(d => {
      if (d.totalScans != null) setTotalScans(Number(d.totalScans));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (report) document.title = `VibeCheck — ${report.token.name} scored ${report.overallScore}`;
    else if (status !== 'idle') document.title = 'VibeCheck — Scanning...';
    else document.title = 'VibeCheck — AI Token Safety Scanner';
  }, [report, status]);

  const isScanning = status === 'fetching' || status === 'analyzing' || status === 'attesting';

  const handleScan = useCallback(async (overrideAddress?: string) => {
    const addr = overrideAddress || address;
    if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Enter a valid BSC token address (0x...)');
      return;
    }
    setError(''); setReport(null); setTokenPreview(null);
    setStatus('fetching'); setElapsed(0); setScoreAnimating(false);

    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 100);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/scan-stream?address=${encodeURIComponent(addr)}`, {
        signal: abortRef.current.signal,
      });
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
              setRecentScans(saveRecentScan(event.data));
              setTimeout(() => setScoreAnimating(false), 1500);
            } else if (event.status === 'error') {
              throw new Error(event.error);
            }
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Scan failed');
        setStatus('error');
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [address]);

  const autoScannedRef = useRef(false);
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (urlAddress && urlAddress.match(/^0x[a-fA-F0-9]{40}$/) && !autoScannedRef.current) {
      autoScannedRef.current = true;
      setAddress(urlAddress);
      handleScan(urlAddress);
    }
  }, [searchParams, handleScan]);

  return (
    <div className="min-h-screen bg-[#050507] bg-grid flex flex-col">
      {/* Scan progress bar at top */}
      {isScanning && (
        <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden h-0.5">
          <div className="scan-progress w-full" />
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/30 py-4 px-6 bg-[#050507]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <span className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              VibeCheck
            </span>
          </a>
          <div className="flex items-center gap-5">
            {totalScans !== null && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono">{totalScans.toLocaleString()}</span>
                <span>scans</span>
              </div>
            )}
            <Link href="/compare" className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-800/50">
              Compare
            </Link>
            <Link href="/history" className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-800/50">
              History
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12 hero-glow relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AI-Powered Token Safety
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Is this token
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              safe?
            </span>
          </h1>
          <p className="text-zinc-500 mb-10 text-lg max-w-lg mx-auto leading-relaxed">
            Paste any BSC token address. Get an instant safety score backed by on-chain attestation.
          </p>

          {/* Search input */}
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="0x... paste token address"
                className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-2xl px-6 py-4 text-lg font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                disabled={isScanning}
              />
            </div>
            <button
              onClick={() => handleScan()}
              disabled={isScanning}
              className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 disabled:shadow-none"
            >
              {isScanning ? (
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : 'Scan'}
            </button>
          </div>

          {/* Example tokens */}
          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-600 mr-1">Try:</span>
            {EXAMPLE_TOKENS.map(t => (
              <button
                key={t.address}
                onClick={() => { setAddress(t.address); handleScan(t.address); }}
                disabled={isScanning}
                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.name} <span className={t.color}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Scan progress */}
          {isScanning && (
            <>
              <ScanProgressBar status={status} />
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="text-sm text-emerald-400/80">{STATUS_MESSAGES[status]}</span>
                <span className="text-xs text-zinc-600 font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
              </div>
            </>
          )}
          {error && (
            <div className="mt-4 inline-flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/10 px-4 py-2 rounded-xl">
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* How it works (idle state) */}
        {status === 'idle' && !report && recentScans.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-16 stagger-children">
            {[
              { icon: '📡', title: 'Fetch On-Chain Data', desc: 'Contract source, top holders, PancakeSwap liquidity, recent transfers — all verified on-chain.' },
              { icon: '🧠', title: 'AI Safety Analysis', desc: 'Gemini 3 Flash evaluates 4 risk categories and produces a comprehensive safety report.' },
              { icon: '⛓️', title: 'On-Chain Attestation', desc: 'Every verdict is permanently recorded on opBNB as a verifiable, immutable attestation.' },
            ].map((step, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-center group hover:border-zinc-700/60 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-sm font-bold text-zinc-200 mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skeleton during scan */}
        {isScanning && !report && (
          <SkeletonReport tokenName={tokenPreview?.name} tokenSymbol={tokenPreview?.symbol} />
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
                  <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
                    {report.token.name}
                    <span className="text-zinc-500 font-normal ml-2 text-xl">({report.token.symbol})</span>
                  </h2>
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider ${RISK_BG[report.riskLevel]}`}>
                    {report.riskLevel}
                  </span>
                </div>
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
              {(Object.entries(report.categories) as [string, RiskCategory][]).map(([key, cat], i) => (
                <CategoryCard key={key} category={cat} icon={CATEGORY_ICONS[key] || '📋'} delay={i * 100} />
              ))}
            </div>

            {/* Quick Stats Card */}
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
                    const text = `🔍 VibeCheck: ${report.token.name} scored ${report.overallScore}/100 — ${report.riskLevel}\n\n${report.summary.slice(0, 180)}\n\nScan any BSC token → vibecheck-bsc.vercel.app`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  𝕏 Share
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/scan/${report.token.address}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => { setReport(null); setStatus('idle'); setAddress(''); }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-2"
                >
                  🔍 New scan
                </button>
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
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {!isScanning && !report && recentScans.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Scans</h2>
              <button
                onClick={() => { localStorage.removeItem(STORAGE_KEY); setRecentScans([]); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {recentScans.map(scan => (
                <a
                  key={scan.address}
                  href={`/scan/${scan.address}`}
                  className="flex items-center justify-between glass glass-hover rounded-xl px-5 py-3.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black w-10 text-center" style={{ color: RISK_COLORS[scan.riskLevel] || '#eab308' }}>
                      {scan.score}
                    </span>
                    <div>
                      <span className="text-zinc-200 font-semibold group-hover:text-emerald-400 transition-colors">{scan.name}</span>
                      <span className="text-zinc-500 ml-1.5 text-sm">({scan.symbol})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase ${RISK_BG[scan.riskLevel]}`}>
                      {scan.riskLevel}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">{timeAgo(scan.timestamp)}</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-5 text-center">
              <a href="/history" className="text-sm text-emerald-500/80 hover:text-emerald-400 transition-colors">
                View all on-chain scans →
              </a>
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
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span>Powered by</span>
            <span className="text-zinc-400 font-medium">Gemini 3</span>
            <span>+</span>
            <span className="text-zinc-400 font-medium">opBNB</span>
            <span>•</span>
            <span className="text-zinc-600">Not financial advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
