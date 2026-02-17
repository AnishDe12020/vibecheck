import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VIBECHECK_ABI } from '../../../lib/chain';
import { cacheGet } from '../../../lib/cache';

const CONTRACT = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';
const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';

function getProvider() {
  return new ethers.JsonRpcProvider(OPBNB_RPC, 204, { staticNetwork: true });
}

export async function GET() {
  try {
    const provider = getProvider();
    const addr = ethers.getAddress(CONTRACT.trim());
    const contract = new ethers.Contract(addr, VIBECHECK_ABI, provider);

    const tokens: any[] = await contract.getRecentTokens(50);

    const results = await Promise.all(
      tokens.filter(t => t && t !== ethers.ZeroAddress).map(async (token) => {
        try {
          const tokenAddr = ethers.getAddress(token.toString());
          const [score, riskLevel, timestamp] = await contract.getLatestScore(tokenAddr);
          // Try to get name from cache
          let name = '';
          let symbol = '';
          try {
            const cached = await cacheGet<any>(`scan:${tokenAddr}`);
            if (cached?.token) {
              name = cached.token.name || '';
              symbol = cached.token.symbol || '';
            }
          } catch {}
          return {
            address: tokenAddr,
            score: Number(score),
            riskLevel: riskLevel,
            timestamp: Number(timestamp),
            name,
            symbol,
          };
        } catch (err: any) {
          console.warn('History item fetch failed:', err.message);
          return null;
        }
      })
    );

    // Deduplicate: keep only the latest scan per token address
    const seen = new Map<string, any>();
    for (const r of results.filter(Boolean)) {
      const existing = seen.get(r!.address);
      if (!existing || r!.timestamp > existing.timestamp) {
        seen.set(r!.address, r);
      }
    }
    const deduplicated = Array.from(seen.values()).sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      tokens: deduplicated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
