'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { VibeCheckReport, ScanStatus, RiskCategory } from '../lib/types';

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e', SAFE: '#22c55e',
  caution: '#eab308', CAUTION: '#eab308',
  danger: '#f97316', DANGER: '#f97316',
  critical: '#ef4444', CRITICAL: '#ef4444',
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
  contract: '📜', concentration: '🏦', liquidity: '💧', trading: '📊',
};

const EXAMPLE_TOKENS = [
  { name: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', label: 'Safe token' },
  { name: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', label: 'Major DeFi' },
  { name: '???', address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Unknown token' },
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
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
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
  const updated = [entry, ...filtered].slice(0, 5);
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

function ScoreGauge({ score, riskLevel, animate }: { score: number; riskLevel: string; animate?: boolean }) {
  const color = RISK_COLORS[riskLevel] || '#eab308';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${animate ? 'animate-score-pop' : ''}`}>
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

function SkeletonReport({ tokenName, tokenSymbol }: { tokenName?: string; tokenSymbol?: string }) {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-[140px] h-[140px] rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-3 w-full">
          {tokenName ? (
            <h2 className="text-2xl font-bold text-zinc-100">
              {tokenName} <span className="text-zinc-500">({tokenSymbol})</span>
            </h2>
          ) : (
            <div className="h-8 bg-zinc-800 rounded w-48" />
          )}
          <div className="h-4 bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-12 bg-zinc-800/50 rounded-lg w-full" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 h-32" />
        ))}
      </div>
    </div>
  );
}

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

  // Load recent scans and total scans on mount
  useEffect(() => {
    setRecentScans(getRecentScans());
    // Fetch total scans from contract
    fetch('/api/total-scans').then(r => r.json()).then(d => {
      if (d.totalScans != null) setTotalScans(Number(d.totalScans));
    }).catch(() => {});
  }, []);

  // Dynamic page title
  useEffect(() => {
    if (report) {
      document.title = `VibeCheck — ${report.token.name} scan`;
    } else if (status !== 'idle') {
      document.title = 'VibeCheck — Scanning...';
    } else {
      document.title = 'VibeCheck — AI Token Safety Scanner';
    }
  }, [report, status]);

  const isScanning = status === 'fetching' || status === 'analyzing' || status === 'attesting';

  const handleScan = useCallback(async (overrideAddress?: string) => {
    const addr = overrideAddress || address;
    if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Enter a valid BSC token address (0x...)');
      return;
    }
    setError('');
    setReport(null);
    setTokenPreview(null);
    setStatus('fetching');
    setElapsed(0);
    setScoreAnimating(false);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startTime) / 1000));
    }, 100);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/scan-stream?address=${encodeURIComponent(addr)}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(await res.text() || `HTTP ${res.status}`);
      }

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
              const updated = saveRecentScan(event.data);
              setRecentScans(updated);
              setTimeout(() => setScoreAnimating(false), 1000);
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

  // Auto-scan from URL param (?address=0x...)
  const autoScannedRef = useRef(false);
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (urlAddress && urlAddress.match(/^0x[a-fA-F0-9]{40}$/) && !autoScannedRef.current) {
      autoScannedRef.current = true;
      setAddress(urlAddress);
      handleScan(urlAddress);
    }
  }, [searchParams, handleScan]);

  const handleExampleClick = (addr: string) => {
    setAddress(addr);
    handleScan(addr);
  };

  const handleRecentClick = (scan: RecentScan) => {
    setAddress(scan.address);
    setReport(scan.report);
    setStatus('complete');
    setTokenPreview(null);
    setError('');
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentScans([]);
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
          <div className="flex items-center gap-4">
            {totalScans !== null && (
              <span className="text-xs text-zinc-500 font-mono">{totalScans.toLocaleString()} scans attested</span>
            )}
            <a href="/history" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
              Scan History →
            </a>
          </div>
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
              disabled={isScanning}
            />
            <button
              onClick={() => handleScan()}
              disabled={isScanning}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-8 py-4 rounded-xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed"
            >
              {isScanning ? (
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

          {/* Example tokens */}
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-xs text-zinc-600">Try:</span>
            {EXAMPLE_TOKENS.map(t => (
              <button
                key={t.address}
                onClick={() => handleExampleClick(t.address)}
                disabled={isScanning}
                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.name} <span className="text-zinc-600">— {t.label}</span>
              </button>
            ))}
          </div>

          {/* How it works */}
          {status === 'idle' && !report && recentScans.length === 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: '📡', title: 'Fetch On-Chain Data', desc: 'Contract source, top holders, PancakeSwap liquidity, recent transfers' },
                { icon: '🧠', title: 'AI Safety Analysis', desc: 'Kimi K2.5 evaluates 4 risk categories and generates a safety score' },
                { icon: '⛓️', title: 'On-Chain Attestation', desc: 'Verdict permanently recorded on opBNB as a verifiable attestation' },
              ].map((step, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5 text-center">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-1">{step.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status + Timer */}
          {isScanning && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-emerald-400 animate-pulse-glow">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                {STATUS_MESSAGES[status]}
              </div>
              <span className="text-xs text-zinc-600 font-mono">{elapsed.toFixed(1)}s</span>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 text-sm">{error}</div>
          )}
        </div>

        {/* Skeleton during scan */}
        {isScanning && !report && (
          <SkeletonReport tokenName={tokenPreview?.name} tokenSymbol={tokenPreview?.symbol} />
        )}

        {/* Report */}
        {report && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
              <ScoreGauge score={report.overallScore} riskLevel={report.riskLevel} animate={scoreAnimating} />
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

            <div className="grid md:grid-cols-2 gap-4">
              {(Object.entries(report.categories) as [string, RiskCategory][]).map(([key, cat]) => (
                <CategoryCard key={key} category={cat} icon={CATEGORY_ICONS[key] || '📋'} />
              ))}
            </div>

            {report.flags.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-semibold text-zinc-200 mb-3">🚩 Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {report.flags.map((flag, i) => (
                    <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share + Attestation */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  const text = `🔍 VibeCheck: ${report.token.name} (${report.token.symbol}) scored ${report.overallScore}/100 — ${report.riskLevel}\n\n${report.summary.slice(0, 200)}\n\nCheck any BSC token: https://vibecheck-bsc.vercel.app`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="text-xs px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer flex items-center gap-2"
              >
                𝕏 Share scan result
              </button>
              {report.attestationTx && (
                <div className="text-xs text-zinc-600">
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
          </div>
        )}

        {/* Recent Scans */}
        {!isScanning && !report && recentScans.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Scans</h2>
              <button onClick={clearHistory} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">
                Clear history
              </button>
            </div>
            <div className="space-y-2">
              {recentScans.map(scan => (
                <button
                  key={scan.address}
                  onClick={() => handleRecentClick(scan)}
                  className="w-full flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-3 hover:border-zinc-700 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: RISK_COLORS[scan.riskLevel] || '#eab308' }}>
                      {scan.score}
                    </span>
                    <div>
                      <span className="text-zinc-200 font-medium">{scan.name}</span>
                      <span className="text-zinc-500 ml-1">({scan.symbol})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RISK_BG[scan.riskLevel]}`}>
                      {scan.riskLevel}
                    </span>
                    <span className="text-xs text-zinc-600">{timeAgo(scan.timestamp)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a href="/history" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
                View all on-chain scans →
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-4 px-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span>Powered by</span>
          <span className="font-semibold text-zinc-400">Kimi K2.5</span>
          <span>+</span>
          <span className="font-semibold text-zinc-400">opBNB</span>
        </div>
        <div className="text-xs text-zinc-600">
          VibeCheck — AI-powered token safety for BNB Smart Chain • Not financial advice
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
