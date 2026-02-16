'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TokenLogo } from '../../components/TokenLogo';
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
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white mb-4">Compare Tokens</h1>
        <p className="text-zinc-500">Analyze two BSC tokens side-by-side to find the safer play.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="glass p-6 rounded-3xl">
          <input
            type="text"
            placeholder="Address 1"
            value={addr1}
            onChange={(e) => setAddr1(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all mb-4"
          />
          {status1 !== 'idle' && (
            <div className="text-xs text-zinc-500 mb-2">Status: <span className="text-emerald-400 font-bold uppercase">{status1}</span></div>
          )}
        </div>
        <div className="glass p-6 rounded-3xl">
          <input
            type="text"
            placeholder="Address 2"
            value={addr2}
            onChange={(e) => setAddr2(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all mb-4"
          />
          {status2 !== 'idle' && (
            <div className="text-xs text-zinc-500 mb-2">Status: <span className="text-emerald-400 font-bold uppercase">{status2}</span></div>
          )}
        </div>
      </div>

      <div className="flex justify-center mb-16">
        <button
          onClick={handleCompare}
          disabled={status1 === 'fetching' || status1 === 'analyzing' || status2 === 'fetching' || status2 === 'analyzing'}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
        >
          {status1 === 'idle' && status2 === 'idle' ? '⚔️ Compare Now' : '🔄 Re-scan Both'}
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
    <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-700 border-dashed border-2 border-zinc-800/50 h-[600px]">
      <div className="text-6xl mb-4">🪙</div>
      <p className="font-bold">Token {side} waiting...</p>
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
