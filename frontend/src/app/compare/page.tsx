'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TokenLogo } from '../../components/TokenLogo';
import { TokenPicker } from '../../components/TokenPicker';
import { HolderChart } from '../../components/HolderChart';
import { LiquidityPanel } from '../../components/LiquidityPanel';
import type { VibeCheckReport, ScanStatus } from '../../lib/types';

const RISK_COLORS: Record<string, string> = {
  SAFE: '#22c55e',
  CAUTION: '#eab308',
  DANGER: '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_BAR_BG: Record<string, string> = {
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const RISK_BG: Record<string, string> = {
  SAFE: 'bg-green-500/10 border-green-500/30 text-green-400',
  CAUTION: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  DANGER: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
};

function ScoreGauge({ score, riskLevel, animate, size = 160, side }: {
  score: number; riskLevel: string; animate?: boolean; size?: number; side: number;
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
          <linearGradient id={`grad-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke={`url(#grad-${side})`} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={animate ? circumference : offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          filter="url(#shadow)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black tracking-tight" style={{ color }}>{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

export default function ComparePage() {
  useEffect(() => {
    document.title = 'VibeCheck — Compare Tokens';
  }, []);

  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');
  const [report1, setReport1] = useState<VibeCheckReport | null>(null);
  const [report2, setReport2] = useState<VibeCheckReport | null>(null);
  const [status1, setStatus1] = useState<ScanStatus>('idle');
  const [status2, setStatus2] = useState<ScanStatus>('idle');

  const runScan = async (address: string, side: 1 | 2) => {
    if (!address || address.length < 42) return;
    
    const setStatus = side === 1 ? setStatus1 : setStatus2;
    const setReport = side === 1 ? setReport1 : setReport2;
    
    setStatus('fetching');
    setReport(null);

    try {
      const res = await fetch(`/api/scan-stream?address=${address}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          setStatus(data.status);
          if (data.status === 'complete') {
            setReport(data.data);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCompare = () => {
    runScan(addr1, 1);
    runScan(addr2, 2);
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <div className="mb-10 text-center hero-glow relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
          <span>⚔️</span> Side-by-Side Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
          <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Compare </span>
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Tokens</span>
        </h1>
        <p className="text-zinc-500 max-w-md mx-auto">Analyze two BSC tokens side-by-side to find the safer play.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[
          { label: 'Token A', addr: addr1, setAddr: setAddr1, status: status1 },
          { label: 'Token B', addr: addr2, setAddr: setAddr2, status: status2 },
        ].map(({ label, addr, setAddr, status: s }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">{label}</label>
            <TokenPicker
              value={addr}
              onChange={setAddr}
              placeholder="Search token or paste 0x..."
            />
            {s !== 'idle' && s !== 'complete' && (
              <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                {s === 'fetching' ? 'Fetching data...' : s === 'analyzing' ? 'AI analyzing...' : s === 'attesting' ? 'Attesting...' : s}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={handleCompare}
          disabled={!addr1 || !addr2 || status1 === 'fetching' || status1 === 'analyzing' || status2 === 'fetching' || status2 === 'analyzing'}
          className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold px-10 py-4 rounded-2xl transition-all text-lg cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 disabled:shadow-none"
        >
          {status1 === 'idle' && status2 === 'idle' ? '⚔️ Compare' : '🔄 Re-scan'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <TokenColumn report={report1} side={1} />
        <TokenColumn report={report2} side={2} />
      </div>
    </div>
  );
}

function TokenColumn({ report, side }: { report: VibeCheckReport | null; side: number }) {
  if (!report) return (
    <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-700 min-h-[400px]">
      <div className="text-5xl mb-4 opacity-30">🪙</div>
      <p className="text-sm text-zinc-600">Paste an address above and hit Compare</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass rounded-3xl p-8 relative overflow-hidden group">
        <div 
          className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"
          style={{ backgroundColor: `${RISK_COLORS[report.riskLevel]}20` }}
        />
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <ScoreGauge score={report.overallScore} riskLevel={report.riskLevel} side={side} size={140} animate />
          <div className="flex-1 text-center md:text-left">
            <TokenLogo address={report.token.address} size={56} className="mb-4 mx-auto md:mx-0" />
            <h2 className="text-2xl font-black text-white leading-tight">{report.token.name}</h2>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-zinc-500 font-mono text-sm">{report.token.symbol}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${RISK_BG[report.riskLevel]}`}>
                {report.riskLevel}
              </span>
            </div>
          </div>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed mb-6 italic">
          "{report.summary}"
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Contract</div>
            <div className="text-sm font-black text-zinc-200">{report.categories.contract.score}/100</div>
          </div>
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Liquidity</div>
            <div className="text-sm font-black text-zinc-200">{report.categories.liquidity.score}/100</div>
          </div>
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Holders</div>
            <div className="text-sm font-black text-zinc-200">{report.categories.concentration.score}/100</div>
          </div>
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Trading</div>
            <div className="text-sm font-black text-zinc-200">{report.categories.trading.score}/100</div>
          </div>
        </div>
      </div>

      <HolderChart holders={report.topHolders} />
      <LiquidityPanel pools={report.liquidity} />
    </div>
  );
}
