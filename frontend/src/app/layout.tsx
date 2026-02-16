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
  title: {
    default: "VibeCheck — AI Token Safety Scanner",
    template: "%s | VibeCheck",
  },
  description: "Paste any BSC token address and get an instant AI-powered safety analysis with on-chain attestation on opBNB.",
  metadataBase: new URL("https://vibecheck-bsc.vercel.app"),
  openGraph: {
    title: "VibeCheck — AI Token Safety Scanner",
    description: "Paste any BSC token address and get an instant AI-powered safety analysis with on-chain attestation on opBNB.",
    siteName: "VibeCheck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeCheck — AI Token Safety Scanner",
    description: "AI-powered token safety for BNB Smart Chain",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
