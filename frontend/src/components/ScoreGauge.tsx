'use client';

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e', SAFE: '#22c55e',
  caution: '#eab308', CAUTION: '#eab308',
  danger: '#f97316', DANGER: '#f97316',
  critical: '#ef4444', CRITICAL: '#ef4444',
};

export { RISK_COLORS };

export function ScoreGauge({ score, riskLevel, animate }: { score: number; riskLevel: string; animate?: boolean }) {
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
