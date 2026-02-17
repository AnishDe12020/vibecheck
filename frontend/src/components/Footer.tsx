export function Footer() {
  return (
    <footer className="border-t border-zinc-800/30 py-6 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-500">VibeCheck</span>
          <span>•</span>
          <span>AI-powered token safety for BNB Chain</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <span className="text-emerald-500 font-medium">Gemini 3</span>
          <span>+</span>
          <a href="https://opbnb.bscscan.com/address/0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-400 font-medium transition-colors">opBNB</a>
          <span>•</span>
          <span>Not financial advice</span>
        </div>
      </div>
    </footer>
  );
}
