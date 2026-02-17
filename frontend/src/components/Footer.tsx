import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/30 py-6 sm:py-8 px-3 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-500">VibeCheck</span>
              <span className="hidden sm:inline">•</span>
            </div>
            <span>AI-powered token safety for BNB Chain</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-600">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Scan</Link>
            <Link href="/compare" className="hover:text-emerald-400 transition-colors">Compare</Link>
            <Link href="/history" className="hover:text-emerald-400 transition-colors">History</Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a href="https://github.com/anis-xda/vibecheck" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a>
            <span className="text-zinc-800">•</span>
            <a href="https://opbnb.bscscan.com/address/0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">opBNB Contract</a>
            <span className="text-zinc-800">•</span>
            <a href="https://dorahacks.io/buidl/goodvibesonly" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">DoraHacks</a>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/70 text-[10px] font-medium">
            ✨ Built for Good Vibes Only Hackathon
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-700">
          <span>Powered by Gemini AI + opBNB Attestation</span>
          <span>Not financial advice. Always DYOR.</span>
        </div>
      </div>
    </footer>
  );
}
