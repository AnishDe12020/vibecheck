import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTokenData } from '@/lib/fetcher';
import { analyzeToken } from '@/lib/analyzer';
import { submitAttestation } from '@/lib/attester';
import { ethers } from 'ethers';

// Simple in-memory cache (1 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

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

    // Try to submit attestation on opBNB (non-blocking, don't fail scan if this errors)
    const contractAddress = process.env.VIBECHECK_CONTRACT_ADDRESS;
    if (contractAddress && process.env.DEPLOYER_PRIVATE_KEY) {
      try {
        const txHash = await submitAttestation(report, contractAddress);
        report.attestationTx = txHash;
        console.log('Attestation submitted:', txHash);
      } catch (err: any) {
        console.warn('Attestation failed (non-fatal):', err.message);
      }
    }

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
