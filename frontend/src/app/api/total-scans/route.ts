import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { OPBNB_RPC, VIBECHECK_ABI } from '@/lib/chain';

const CONTRACT_ADDRESS = process.env.VIBECHECK_CONTRACT_ADDRESS || '0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161';

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(OPBNB_RPC);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VIBECHECK_ABI, provider);
    const total = await contract.totalScans();
    return NextResponse.json({ totalScans: total.toString() });
  } catch (err: any) {
    console.warn('Failed to fetch totalScans:', err.message);
    return NextResponse.json({ totalScans: null });
  }
}
