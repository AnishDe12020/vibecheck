import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { OPBNB_RPC, VIBECHECK_ABI } from '../../../lib/chain';

const CONTRACT = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC);
    const contract = new ethers.Contract(CONTRACT, VIBECHECK_ABI, provider);

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
