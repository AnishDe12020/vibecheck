import { NextRequest } from 'next/server';
import { fetchAllTokenData } from '@/lib/fetcher';
import { analyzeToken } from '@/lib/analyzer';
import { submitAttestation } from '@/lib/attester';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address || !ethers.isAddress(address)) {
    return new Response(
      JSON.stringify({ error: 'Invalid token address' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const normalizedAddress = ethers.getAddress(address);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // Phase 1: Fetching
        send({ status: 'fetching' });
        const tokenData = await fetchAllTokenData(normalizedAddress);
        send({
          status: 'fetching_done',
          tokenName: tokenData.tokenInfo?.name || 'Unknown',
          tokenSymbol: tokenData.tokenInfo?.symbol || '???',
        });

        // Phase 2: Analyzing
        send({ status: 'analyzing' });
        const report = await analyzeToken(tokenData);
        send({ status: 'analyzing_done' });

        // Phase 3: Attesting
        const contractAddress = process.env.VIBECHECK_CONTRACT_ADDRESS;
        if (contractAddress && process.env.DEPLOYER_PRIVATE_KEY) {
          send({ status: 'attesting' });
          try {
            const txHash = await submitAttestation(report, contractAddress);
            report.attestationTx = txHash;
          } catch (err: any) {
            console.warn('Attestation failed (non-fatal):', err.message);
          }
        }

        // Phase 4: Complete
        send({ status: 'complete', data: report });
      } catch (err: any) {
        send({ status: 'error', error: err.message || 'Scan failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
