'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { VibeCheckReport, ScanStatus, RiskCategory } from '../lib/types';
import { RISK_COLORS, RISK_BG, STATUS_MESSAGES, CATEGORY_ICONS } from '../lib/constants';
import { TokenLogo } from '../components/TokenLogo';
import { HolderChart } from '../components/HolderChart';
import { LiquidityPanel } from '../components/LiquidityPanel';
import { TokenPicker } from '../components/TokenPicker';
import { ScoreGauge } from '../components/ScoreGauge';
import { ScanProgressBar } from '../components/ScanProgressBar';
import { CategoryCard } from '../components/CategoryCard';
import { SkeletonReport } from '../components/SkeletonReport';
import { StickySearchBar } from '../components/StickySearchBar';

const POPULAR_TOKENS = [
  { name: 'PancakeSwap', symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
  { name: 'FLOKI', symbol: 'FLOKI', address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E' },
  { name: 'Baby Doge', symbol: 'BabyDoge', address: '0xc748673057861a797275CD8A068AbB95A902e8de' },
  { name: 'Dogecoin', symbol: 'DOGE', address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43' },
  { name: 'Shiba Inu', symbol: 'SHIB', address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D' },
  { name: 'Venus', symbol: 'XVS', address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63' },
  { name: 'Trust Wallet', symbol: 'TWT', address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003' },
  { name: 'Alpaca Finance', symbol: 'ALPACA', address: '0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F' },
  { name: 'SafePal', symbol: 'SFP', address: '0xD41FDb03Ba84762dD66a0af1a6C8540FF1ba5dfb' },
  { name: 'Radio Caca', symbol: 'RACA', address: '0x12BB890508c125b066cA90BC7b69D45FA8FBC07B' },
  { name: 'Coin98', symbol: 'C98', address: '0xaEC945e04baF28b135Fa7c640f624f8D90F1C3a6' },
  { name: 'Mobox', symbol: 'MBOX', address: '0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377' },
];

const EXAMPLE_TOKENS = [
  { name: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', label: 'Safe', color: 'text-green-400', border: 'border-green-500/30' },
  { name: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', label: 'Safe', color: 'text-green-400', border: 'border-green-500/30' },
  { name: 'SafeMoon', address: '0x8076C74C5e3F5852037F31Ff0093Eeb8c8ADd8D3', label: 'Risky', color: 'text-yellow-400', border: 'border-yellow-500/30' },
  { name: 'Squid Game', address: '0x87230146E138d3F296a9a77e497A2A83012e9Bc5', label: 'Scam', color: 'text-red-400', border: 'border-red-500/30' },
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

function CopyFeedback({ children, text }: { children: React.ReactNode; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
    >
      {copied ? '✅ Copied!' : children}
    </button>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
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
          } catch (e: unknown) {
            const err = e as Error;
            if (err.message && err.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error & { name?: string };
      if (error.name !== 'AbortError') {
        setError(error.message || 'Scan failed');
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
    <>
      {/* Sticky scan bar when viewing results */}
      {(report || isScanning) && <StickySearchBar />}

      {/* Scan progress bar at top */}
      {isScanning && (
        <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden h-0.5">
          <div className="scan-progress w-full" />
        </div>
      )}

      <div className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-8 sm:py-16">
        {/* Hero — Split layout for idle, centered for scanning/results */}
        {status === 'idle' && !report ? (
          <>
            <div className="mb-10 sm:mb-12 hero-glow relative z-10 flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-16">
              {/* Left side */}
              <div className="flex-[3] min-w-0 w-full lg:w-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-6 sm:mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live on BNB Chain
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight leading-[1.1]">
                  <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    Is this token
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    safe?
                  </span>
                </h1>
                <p className="text-zinc-400 mb-8 sm:mb-10 text-base sm:text-lg max-w-lg leading-relaxed">
                  Paste any BSC token address. Get an instant AI-powered safety score backed by on-chain attestation.
                </p>

                {/* Search input */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <div className="flex-1 min-w-0">
                    <TokenPicker
                      value={address}
                      onChange={setAddress}
                      placeholder="Search token or paste 0x address..."
                      disabled={isScanning}
                    />
                  </div>
                  <button
                    onClick={() => handleScan()}
                    disabled={isScanning || !address}
                    aria-label="Scan token"
                    className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                  >
                    Scan
                  </button>
                </div>

                {/* Example tokens */}
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs text-zinc-600 mr-0.5 sm:mr-1">Try:</span>
                  {EXAMPLE_TOKENS.map(t => (
                    <button
                      key={t.address}
                      onClick={() => { setAddress(t.address); handleScan(t.address); }}
                      disabled={isScanning}
                      className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-800/40 border ${t.border} text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {t.name} <span className={t.color}>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Total scans badge */}
                {totalScans !== null && totalScans > 0 && (
                  <div className="mt-3 text-xs text-zinc-600">
                    <span className="text-emerald-500 font-semibold">{totalScans.toLocaleString()}</span> tokens scanned on-chain
                  </div>
                )}
              </div>

              {/* Right side — Floating preview card (desktop only) */}
              <div className="hidden lg:block flex-[2] relative">
                <div
                  className="glass rounded-2xl p-6 border-emerald-500/10"
                  style={{
                    transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                    animation: 'heroFloat 6s ease-in-out infinite',
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Safety Report</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider">
                      Safe
                    </span>
                  </div>
                  <div className="flex justify-center mb-4">
                    <ScoreGauge score={95} riskLevel="SAFE" size={120} id="hero-preview" />
                  </div>
                  <div className="text-center mb-4">
                    <span className="text-sm font-bold text-zinc-200">PancakeSwap</span>
                    <span className="text-zinc-500 ml-1.5 text-xs">(CAKE)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Liquidity</div>
                      <div className="text-sm font-bold text-zinc-200">$42.3M</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Holders</div>
                      <div className="text-sm font-bold text-zinc-200">1.2M+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Powered By Trust Bar */}
            <div className="border-t border-zinc-800/50 py-5 mb-10 sm:mb-12">
              <div className="flex items-center justify-center gap-3 sm:gap-8 overflow-x-auto text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-medium whitespace-nowrap pb-1">
                <span className="text-zinc-600">Powered by</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  {/* Gemini sparkle */}
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 0C14 7.732 7.732 14 0 14c7.732 0 14 6.268 14 14 0-7.732 6.268-14 14-14C20.268 14 14 7.732 14 0z" fill="#8B8BF5"/></svg>
                  Gemini AI
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  {/* BNB diamond */}
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 4l-4 4 4 4 4-4-4-4zm-8 8l-4 4 4 4 4-4-4-4zm16 0l-4 4 4 4 4-4-4-4zm-8 8l-4 4 4 4 4-4-4-4z" fill="#F3BA2F"/></svg>
                  opBNB
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  {/* PancakeSwap bunny-ish */}
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#633001" fillOpacity="0.3"/><circle cx="16" cy="16" r="10" fill="#D1884F" fillOpacity="0.6"/><circle cx="16" cy="14" r="5" fill="#FEDC90" fillOpacity="0.5"/></svg>
                  PancakeSwap
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  {/* BSCScan */}
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="5" height="16" rx="2" fill="#8C8C8C"/><rect x="13.5" y="4" width="5" height="24" rx="2" fill="#8C8C8C"/><rect x="23" y="12" width="5" height="12" rx="2" fill="#8C8C8C"/></svg>
                  BSCScan
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  {/* Honeypot shield */}
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 3L5 8v7c0 7.18 4.7 13.89 11 16 6.3-2.11 11-8.82 11-16V8L16 3z" fill="#E6A817" fillOpacity="0.5"/><path d="M14 16l-2-2-1.5 1.5L14 19l7-7-1.5-1.5L14 16z" fill="#E6A817"/></svg>
                  Honeypot.is
                </span>
              </div>
            </div>

            {/* Token Marquee */}
            <div className="relative overflow-hidden mb-10 sm:mb-12 -mx-3 sm:-mx-6">
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#050507] to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#050507] to-transparent z-10" />
              <div className="flex animate-marquee whitespace-nowrap">
                {[...POPULAR_TOKENS, ...POPULAR_TOKENS].map((t, i) => (
                  <button
                    key={`${t.address}-${i}`}
                    onClick={() => { setAddress(t.address); handleScan(t.address); }}
                    className="inline-flex items-center gap-2 mx-2 px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-emerald-500/30 hover:bg-zinc-800/60 transition-all cursor-pointer group shrink-0"
                  >
                    <TokenLogo address={t.address} size={20} />
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-400 transition-colors">{t.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center mb-10 sm:mb-12 hero-glow relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-4 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AI-Powered Token Safety
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 tracking-tight">
              <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Is this token
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                safe?
              </span>
            </h1>
            <p className="text-zinc-500 mb-8 sm:mb-10 text-base sm:text-lg max-w-lg mx-auto leading-relaxed px-2">
              Paste any BSC token address. Get an instant safety score backed by on-chain attestation.
            </p>

            {/* Search input */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 min-w-0">
                <TokenPicker
                  value={address}
                  onChange={setAddress}
                  placeholder="Search token or paste 0x address..."
                  disabled={isScanning}
                />
              </div>
              <button
                onClick={() => handleScan()}
                disabled={isScanning || !address}
                aria-label="Scan token"
                className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 disabled:shadow-none"
              >
                {isScanning ? (
                  <svg className="animate-spin h-6 w-6 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : 'Scan'}
              </button>
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
        )}

        {/* How it works (idle state) */}
        {status === 'idle' && !report && recentScans.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto mb-16 stagger-children">
            {[
              { icon: '📡', title: 'Fetch On-Chain Data', desc: 'Contract source, top holders, PancakeSwap liquidity, recent transfers — all verified on-chain.' },
              { icon: '🧠', title: 'AI Safety Analysis', desc: 'Gemini 3 Flash evaluates 4 risk categories and produces a comprehensive safety report.' },
              { icon: '⛓️', title: 'On-Chain Attestation', desc: 'Every verdict is permanently recorded on opBNB as a verifiable, immutable attestation.' },
            ].map((step, i) => (
              <div key={i} className="glass rounded-2xl p-5 sm:p-6 text-center group hover:border-zinc-700/60 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-sm font-bold text-zinc-200 mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Popular Tokens (idle, no results) */}
        {status === 'idle' && !report && (
          <div className="mb-12 sm:mb-16">
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-zinc-200">🔥 Popular Tokens</h2>
              <p className="text-xs text-zinc-500 mt-1">Tap to scan</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              {POPULAR_TOKENS.map(t => (
                <button
                  key={t.address}
                  onClick={() => { setAddress(t.address); handleScan(t.address); }}
                  className="glass rounded-xl p-3 sm:p-4 flex items-center gap-2.5 hover:border-zinc-600 hover:bg-zinc-800/40 transition-all cursor-pointer group text-left"
                >
                  <TokenLogo address={t.address} size={28} />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">{t.name}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">{t.symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skeleton during scan */}
        {isScanning && !report && (
          <SkeletonReport tokenName={tokenPreview?.name} tokenSymbol={tokenPreview?.symbol} />
        )}

        {/* Report */}
        {report && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            {/* Score card */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-5 sm:gap-10 overflow-hidden">
              <ScoreGauge score={report.overallScore} riskLevel={report.riskLevel} animate={scoreAnimating} size={140} />
              <div className="flex-1 min-w-0 text-center md:text-left w-full">
                <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start mb-3 flex-wrap">
                  <TokenLogo address={report.token.address} size={36} />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-100 tracking-tight break-words">
                    {report.token.name}
                    <span className="text-zinc-500 font-normal ml-1.5 sm:ml-2 text-base sm:text-lg md:text-xl">({report.token.symbol})</span>
                  </h2>
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider shrink-0 animate-badge-pop ${RISK_BG[report.riskLevel]}`}>
                    {report.riskLevel}
                  </span>
                </div>
                <p className="text-zinc-400 mb-4 sm:mb-5 leading-relaxed text-sm sm:text-base">{report.summary}</p>
                <div className="glass rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm">
                    <span className="text-zinc-500 font-semibold">💡 Recommendation: </span>
                    <span className="text-zinc-300">{report.recommendation}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4 stagger-children">
              {(Object.entries(report.categories) as [string, RiskCategory][]).map(([key, cat], i) => (
                <CategoryCard key={key} category={cat} icon={CATEGORY_ICONS[key] || '📋'} delay={i * 100} />
              ))}
            </div>

            {/* Quick Stats Card */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-emerald-500/10 bg-emerald-500/[0.02] animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> Project Intel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Status</div>
                  <div className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${report.token.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {report.token.isVerified ? '✅ Verified' : '⚠️ Unverified'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Owner</div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-300 truncate font-mono">
                    {report.token.owner ? (
                      <a href={`https://bscscan.com/address/${report.token.owner}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                        {report.token.owner.slice(0, 6)}...{report.token.owner.slice(-4)}
                      </a>
                    ) : 'Renounced'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Supply</div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-300">
                    {Math.floor(Number(report.token.totalSupply) / Math.pow(10, report.token.decimals)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Chain</div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                    <img src="https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png" className="w-3.5 h-3.5" alt="BSC" />
                    BSC
                  </div>
                </div>
              </div>
            </div>

            {/* Data Panels */}
            {(report.topHolders?.length > 0 || report.liquidity?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                {report.topHolders?.length > 0 && <HolderChart holders={report.topHolders} />}
                {report.liquidity?.length > 0 && <LiquidityPanel pools={report.liquidity} />}
              </div>
            )}

            {/* Flags */}
            {report.flags.length > 0 && (
              <div className="glass rounded-2xl p-4 sm:p-6">
                <h3 className="font-bold text-zinc-200 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>🚩</span> Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.flags.map((flag, i) => (
                    <span key={i} className="text-xs sm:text-sm px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                <button
                  onClick={() => {
                    const text = `🔍 VibeCheck: ${report.token.name} scored ${report.overallScore}/100 — ${report.riskLevel}\n\n${report.summary.slice(0, 180)}\n\nScan any BSC token → vibecheck-bsc.vercel.app`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  𝕏 Share
                </button>
                <CopyFeedback text={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${report.token.address}`}>
                  📋 Copy Link
                </CopyFeedback>
                <button
                  onClick={() => { setReport(null); setStatus('idle'); setAddress(''); }}
                  className="text-xs px-4 py-2.5 rounded-xl glass text-zinc-400 hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-2"
                >
                  🔍 New scan
                </button>
              </div>
              {report.attestationTx && (
                <div className="text-xs text-zinc-600 flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Attested on opBNB:</span>
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
                  className="flex items-center justify-between glass glass-hover rounded-xl px-3 sm:px-5 py-3 sm:py-3.5 transition-all cursor-pointer group gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="text-lg sm:text-xl font-black w-8 sm:w-10 text-center shrink-0" style={{ color: RISK_COLORS[scan.riskLevel] || '#eab308' }}>
                      {scan.score}
                    </span>
                    <div className="min-w-0">
                      <span className="text-zinc-200 font-semibold group-hover:text-emerald-400 transition-colors text-sm sm:text-base">{scan.name}</span>
                      <span className="text-zinc-500 ml-1 sm:ml-1.5 text-xs sm:text-sm">({scan.symbol})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={`text-[10px] px-2 sm:px-2.5 py-1 rounded-full border font-semibold uppercase ${RISK_BG[scan.riskLevel]}`}>
                      {scan.riskLevel}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono hidden sm:inline">{timeAgo(scan.timestamp)}</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-5 text-center">
              <Link href="/history" className="text-sm text-emerald-500/80 hover:text-emerald-400 transition-colors">
                View all on-chain scans →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
