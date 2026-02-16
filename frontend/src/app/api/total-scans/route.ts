import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VIBECHECK_ABI } from '@/lib/chain';

const CONTRACT_ADDRESS = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';
const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';

function getProvider() {
  return new ethers.JsonRpcProvider(OPBNB_RPC, 204, { staticNetwork: true });
}

export async function GET() {
  try {
    const provider = getProvider();
    const addr = ethers.getAddress(CONTRACT_ADDRESS.trim());
    const contract = new ethers.Contract(addr, VIBECHECK_ABI, provider);
    const total = await contract.totalScans();
    return NextResponse.json({ totalScans: total.toString() });
  } catch (err: any) {
    console.warn('Failed to fetch totalScans:', err.message);
    return NextResponse.json({ totalScans: null });
  }
}
