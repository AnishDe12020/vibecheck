import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeCheck — AI Token Safety Scanner",
  description: "Paste any BSC token address and get an instant AI-powered safety analysis with on-chain attestation on opBNB",
  openGraph: {
    title: "VibeCheck — AI Token Safety Scanner",
    description: "AI-powered token safety analysis for BNB Smart Chain with on-chain attestations",
    siteName: "VibeCheck",
    type: "website",
    url: "https://vibecheck-bsc.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCheck — AI Token Safety Scanner",
    description: "AI-powered token safety analysis for BNB Smart Chain",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-zinc-200`}
      >
        {children}
      </body>
    </html>
  );
}
