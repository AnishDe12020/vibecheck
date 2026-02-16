import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VIBECHECK_ABI } from '../../../lib/chain';

const CONTRACT = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';
const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';

function getProvider() {
  // Use static provider config to avoid ENS lookups
  return new ethers.JsonRpcProvider(OPBNB_RPC, { name: 'opbnb', chainId: 204 }, { staticNetwork: true });
}

export async function GET() {
  try {
    const provider = getProvider();
    const addr = ethers.getAddress(CONTRACT.trim());
    const contract = new ethers.Contract(addr, VIBECHECK_ABI, provider);

    const tokens: string[] = await contract.getRecentTokens(50);

    const results = await Promise.all(
      tokens.filter(t => t !== ethers.ZeroAddress).map(async (token) => {
        try {
          const [score, riskLevel, timestamp] = await contract.getLatestScore(token);
          return {
            address: token,
            score: Number(score),
            riskLevel: riskLevel,
            timestamp: Number(timestamp),
          };
        } catch {
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
