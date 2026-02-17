import { NextRequest } from 'next/server';
import { ethers } from 'ethers';
import { BSCSCAN_API } from '@/lib/chain';
import { withSecurityHeaders } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TokenTx {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  timeStamp: string;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address || !ethers.isAddress(address)) {
    const res = new Response(
      JSON.stringify({ error: 'Invalid wallet address' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  }

  try {
    const apiKey = process.env.BSCSCAN_API_KEY || '';
    const url = `${BSCSCAN_API}module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${apiKey}`;

    const resp = await fetch(url, { next: { revalidate: 0 } });
    const data = await resp.json();

    if (data.status !== '1' || !Array.isArray(data.result)) {
      const res = new Response(
        JSON.stringify({ tokens: [], message: data.message || 'No tokens found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      return withSecurityHeaders(res, req);
    }

    // Deduplicate by contract address, keep most recent
    const seen = new Map<string, { address: string; name: string; symbol: string; timestamp: number }>();
    for (const tx of data.result as TokenTx[]) {
      const ca = tx.contractAddress.toLowerCase();
      if (!seen.has(ca)) {
        seen.set(ca, {
          address: tx.contractAddress,
          name: tx.tokenName,
          symbol: tx.tokenSymbol,
          timestamp: parseInt(tx.timeStamp, 10),
        });
      }
    }

    // Sort by most recent activity, limit to 10
    const tokens = Array.from(seen.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const res = new Response(
      JSON.stringify({ tokens }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  } catch (err) {
    const res = new Response(
      JSON.stringify({ error: 'Failed to fetch portfolio' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  }
}
