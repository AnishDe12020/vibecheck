'use client';

import type { RiskCategory } from '../lib/types';

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

export { RISK_BG };

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📜', concentration: '🏦', liquidity: '💧', trading: '📊',
};

export { CATEGORY_ICONS };

export function CategoryCard({ category, icon }: { category: RiskCategory; icon: string }) {
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
