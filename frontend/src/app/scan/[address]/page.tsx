'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import type { VibeCheckReport, RiskCategory } from '../../../lib/types';
import { ScoreGauge, RISK_COLORS } from '../../../components/ScoreGauge';
import { CategoryCard, RISK_BG, CATEGORY_ICONS } from '../../../components/CategoryCard';

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ScanPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [report, setReport] = useState<VibeCheckReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError('');
    setStatus('Fetching on-chain data...');

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
            if (event.status === 'fetching') setStatus('Fetching on-chain data...');
            else if (event.status === 'analyzing') setStatus('AI is analyzing...');
            else if (event.status === 'attesting') setStatus('Recording on opBNB...');
            else if (event.status === 'complete') {
              setReport(event.data);
              setStatus('');
            } else if (event.status === 'error') throw new Error(event.error);
          } catch (e: unknown) {
            if (e instanceof Error && e.message && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, [address]);

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
          <Link href="/history" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Scan History →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {!report && (
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Token Scan</h1>
            <p className="font-mono text-zinc-400 mb-1 text-lg">{shortenAddress(address)}</p>
            <p className="text-xs text-zinc-600 font-mono mb-8 break-all">{address}</p>

            {!scanning && (
              <button
                onClick={handleScan}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-4 rounded-xl transition-all text-lg cursor-pointer"
              >
                🔍 Scan this token
              </button>
            )}

            {scanning && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {status}
                </div>
              </div>
            )}

            {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
          </div>
        )}

        {report && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
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

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  const text = `🔍 VibeCheck: ${report.token.name} (${report.token.symbol}) scored ${report.overallScore}/100 — ${report.riskLevel}\n\n${report.summary.slice(0, 200)}\n\nCheck any BSC token: https://vibecheck-bsc.vercel.app/scan/${address}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="text-xs px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer flex items-center gap-2"
              >
                𝕏 Share scan result
              </button>
              {report.attestationTx && (
                <div className="text-xs text-zinc-600">
                  Attested on opBNB:{' '}
                  <a href={`https://opbnb.bscscan.com/tx/${report.attestationTx}`} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-400 font-mono">
                    {report.attestationTx.slice(0, 10)}...{report.attestationTx.slice(-8)}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/50 py-4 px-6 text-center text-xs text-zinc-600">
        VibeCheck — AI-powered token safety for BNB Smart Chain
      </footer>
    </div>
  );
}
