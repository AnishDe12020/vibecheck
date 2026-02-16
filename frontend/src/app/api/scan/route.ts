import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTokenData } from '@/lib/fetcher';
import { analyzeToken } from '@/lib/analyzer';
import { ethers } from 'ethers';

// Simple in-memory cache (1 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    // Validate address
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid token address' },
        { status: 400 }
      );
    }

    const normalizedAddress = ethers.getAddress(address);

    // Check cache
    const cached = cache.get(normalizedAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // Fetch all on-chain data
    const tokenData = await fetchAllTokenData(normalizedAddress);

    // Run AI analysis
    const report = await analyzeToken(tokenData);

    // Cache the result
    cache.set(normalizedAddress, { data: report, timestamp: Date.now() });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Scan failed' },
      { status: 500 }
    );
  }
}
