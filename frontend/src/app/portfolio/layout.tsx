import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Scanner',
  description: 'Scan your entire BSC wallet portfolio for token safety risks. Connect your wallet or paste an address.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
