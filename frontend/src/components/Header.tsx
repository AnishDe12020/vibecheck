'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/compare', label: 'Compare' },
    { href: '/history', label: 'History' },
  ];

  return (
    <header className="border-b border-zinc-800/30 py-4 px-6 bg-[#050507]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
            ✓
          </div>
          <span className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            VibeCheck
          </span>
        </Link>
        <div className="flex items-center gap-5">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pathname === link.href
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
