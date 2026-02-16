import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { OPBNB_RPC, VIBECHECK_ABI } from '../../../lib/chain';

const CONTRACT = '0x851d1B08F9166D18eC379B990D7E9D6d45FFA8CA';

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
