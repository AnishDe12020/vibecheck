import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VIBECHECK_ABI, OPBNB_RPC, OPBNB_CHAIN_ID } from '../../../lib/chain';

const CONTRACT_ADDRESS = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC, OPBNB_CHAIN_ID, { staticNetwork: true });
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VIBECHECK_ABI, provider);

    const [totalScans, recentTokens] = await Promise.all([
      contract.totalScans().catch(() => 0n),
      contract.getRecentTokens(20).catch(() => []),
    ]);

    // Fetch attestations for each recent token
    const tokenData = await Promise.all(
      (recentTokens as string[]).map(async (tokenAddress: string) => {
        try {
          const attestations = await contract.getAttestations(tokenAddress);
          const latest = attestations[attestations.length - 1];
          return {
            token: tokenAddress,
            score: Number(latest.score),
            riskLevel: latest.riskLevel,
            timestamp: Number(latest.timestamp),
            totalAttestations: attestations.length,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      totalScans: Number(totalScans),
      contractAddress: CONTRACT_ADDRESS,
      tokens: tokenData.filter(Boolean),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch attestations' }, { status: 500 });
  }
}
