import { ethers } from 'ethers';
import type { TokenInfo, HolderInfo, LiquidityInfo } from './types';
import {
  getBscProvider,
  ERC20_ABI,
  FACTORY_ABI,
  PAIR_ABI,
  PANCAKE_FACTORY,
  WBNB,
  BUSD,
  USDT_BSC,
  DEAD_ADDRESSES,
  KNOWN_ADDRESSES,
  BSCSCAN_API,
} from './chain';

const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || '';

// ──────────────────────────────────────────
// Token Info
// ──────────────────────────────────────────

export async function fetchTokenInfo(address: string): Promise<TokenInfo> {
  const provider = getBscProvider();
  const token = new ethers.Contract(address, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name().catch(() => 'Unknown'),
    token.symbol().catch(() => '???'),
    token.decimals().catch(() => 18),
    token.totalSupply().catch(() => '0'),
  ]);

  // Try to get owner
  let owner: string | undefined;
  try {
    owner = await token.owner();
  } catch {
    owner = undefined;
  }

  // Check if contract is verified on BSCScan
  const { isVerified, sourceCode, compiler } = await fetchContractSource(address);

  return {
    address,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: totalSupply.toString(),
    isVerified,
    sourceCode,
    compiler,
    owner,
  };
}

// ──────────────────────────────────────────
// Contract Source Code
// ──────────────────────────────────────────

export async function fetchContractSource(address: string): Promise<{
  isVerified: boolean;
  sourceCode?: string;
  compiler?: string;
}> {
  try {
    const url = `${BSCSCAN_API}?module=contract&action=getsourcecode&address=${address}&apikey=${BSCSCAN_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === '1' && data.result?.[0]) {
      const result = data.result[0];
      const isVerified = result.SourceCode && result.SourceCode !== '';
      return {
        isVerified,
        sourceCode: isVerified ? result.SourceCode : undefined,
        compiler: result.CompilerVersion || undefined,
      };
    }
  } catch (e) {
    console.error('BSCScan source fetch error:', e);
  }

  return { isVerified: false };
}

// ──────────────────────────────────────────
// Top Holders
// ──────────────────────────────────────────

export async function fetchTopHolders(
  tokenAddress: string,
  totalSupply: bigint,
  decimals: number,
  count: number = 20
): Promise<HolderInfo[]> {
  // Try BSCScan token holder list API
  try {
    const url = `${BSCSCAN_API}?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=${count}&apikey=${BSCSCAN_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((h: any) => {
        const balance = BigInt(h.TokenHolderQuantity || '0');
        const percentage = totalSupply > 0n
          ? Number((balance * 10000n) / totalSupply) / 100
          : 0;
        const addr = h.TokenHolderAddress.toLowerCase();
        return {
          address: h.TokenHolderAddress,
          balance: ethers.formatUnits(balance, decimals),
          percentage,
          label: KNOWN_ADDRESSES[addr] || (DEAD_ADDRESSES.includes(addr) ? '🔥 Burn' : undefined),
        };
      });
    }
  } catch (e) {
    console.error('Holder fetch error:', e);
  }

  return [];
}

// ──────────────────────────────────────────
// Liquidity
// ──────────────────────────────────────────

export async function fetchLiquidity(tokenAddress: string): Promise<LiquidityInfo[]> {
  const provider = getBscProvider();
  const factory = new ethers.Contract(PANCAKE_FACTORY, FACTORY_ABI, provider);
  const results: LiquidityInfo[] = [];

  // Check pairs against WBNB, BUSD, USDT
  const quoteTokens = [
    { address: WBNB, symbol: 'WBNB', price: 0 },
    { address: BUSD, symbol: 'BUSD', price: 1 },
    { address: USDT_BSC, symbol: 'USDT', price: 1 },
  ];

  // Get BNB price (rough)
  try {
    const bnbPair = await factory.getPair(WBNB, BUSD);
    if (bnbPair !== ethers.ZeroAddress) {
      const pair = new ethers.Contract(bnbPair, PAIR_ABI, provider);
      const [reserves, t0] = await Promise.all([pair.getReserves(), pair.token0()]);
      const isWbnbToken0 = t0.toLowerCase() === WBNB.toLowerCase();
      const bnbReserve = Number(ethers.formatEther(isWbnbToken0 ? reserves[0] : reserves[1]));
      const busdReserve = Number(ethers.formatEther(isWbnbToken0 ? reserves[1] : reserves[0]));
      quoteTokens[0].price = busdReserve / bnbReserve;
    }
  } catch (e) {
    quoteTokens[0].price = 600; // fallback
  }

  for (const qt of quoteTokens) {
    try {
      const pairAddress = await factory.getPair(tokenAddress, qt.address);
      if (pairAddress === ethers.ZeroAddress) continue;

      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      const [reserves, t0] = await Promise.all([pair.getReserves(), pair.token0()]);

      const isTokenFirst = t0.toLowerCase() === tokenAddress.toLowerCase();
      const quoteReserve = isTokenFirst ? reserves[1] : reserves[0];
      const quoteAmount = Number(ethers.formatEther(quoteReserve));
      const liquidityUSD = quoteAmount * qt.price * 2; // Both sides

      results.push({
        pair: pairAddress,
        dex: 'PancakeSwap V2',
        token0: isTokenFirst ? tokenAddress : qt.address,
        token1: isTokenFirst ? qt.address : tokenAddress,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        liquidityUSD,
        isLocked: false, // TODO: Check lock contracts
      });
    } catch (e) {
      // Pair doesn't exist or error
    }
  }

  return results;
}

// ──────────────────────────────────────────
// Recent Transactions (large transfers)
// ──────────────────────────────────────────

export async function fetchRecentTransfers(tokenAddress: string): Promise<any[]> {
  try {
    const url = `${BSCSCAN_API}?module=account&action=tokentx&contractaddress=${tokenAddress}&page=1&offset=50&sort=desc&apikey=${BSCSCAN_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result;
    }
  } catch (e) {
    console.error('Transfer fetch error:', e);
  }
  return [];
}

// ──────────────────────────────────────────
// Aggregate all data for analysis
// ──────────────────────────────────────────

export async function fetchAllTokenData(address: string) {
  const tokenInfo = await fetchTokenInfo(address);
  
  const totalSupply = BigInt(tokenInfo.totalSupply);
  
  const [holders, liquidity, transfers] = await Promise.all([
    fetchTopHolders(address, totalSupply, tokenInfo.decimals),
    fetchLiquidity(address),
    fetchRecentTransfers(address),
  ]);

  return {
    tokenInfo,
    holders,
    liquidity,
    transfers,
  };
}
