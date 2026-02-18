import { ethers } from 'ethers';
import { VIBECHECK_ABI } from './chain';
import type { VibeCheckReport } from './types';

const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';
const OPBNB_CHAIN_ID = 204;

/**
 * Submit an attestation to the VibeCheck contract on opBNB.
 * Runs server-side with the deployer key.
 */
export async function submitAttestation(
  report: VibeCheckReport,
  contractAddress: string
): Promise<string> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');
  if (!contractAddress) throw new Error('VIBECHECK_CONTRACT_ADDRESS not set');

  const provider = new ethers.JsonRpcProvider(OPBNB_RPC, OPBNB_CHAIN_ID);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, VIBECHECK_ABI, wallet);

  // Create a simple content hash of the report (no IPFS needed for hackathon)
  const reportJson = JSON.stringify({
    score: report.overallScore,
    riskLevel: report.riskLevel,
    summary: report.summary,
    categories: report.categories,
    flags: report.flags,
    recommendation: report.recommendation,
    timestamp: report.timestamp,
  });
  const reportCID = ethers.keccak256(ethers.toUtf8Bytes(reportJson));

  const tx = await contract.submitAttestation(
    report.token.address,
    report.overallScore,
    report.riskLevel,
    reportCID  // contract expects string, passing hex hash string
  );

  const receipt = await tx.wait();
  return receipt.hash;
}
