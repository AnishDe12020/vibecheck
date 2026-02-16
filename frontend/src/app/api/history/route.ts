import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VIBECHECK_ABI } from '../../../lib/chain';

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
          return {
            address: tokenAddr,
            score: Number(score),
            riskLevel: riskLevel,
            timestamp: Number(timestamp),
          };
        } catch (err: any) {
          console.warn('History item fetch failed:', err.message);
          return null;
        }
      })
    );

    return NextResponse.json({
      tokens: results.filter(Boolean),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
