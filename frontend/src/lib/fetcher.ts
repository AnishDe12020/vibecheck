import { ethers } from 'ethers';
import type { TokenInfo, HolderInfo, LiquidityInfo, HoneypotResult, ContractPatterns, LPLockInfo } from './types';
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
  BINANCE_PEGGED_TOKENS,
  BSCSCAN_API,
} from './chain';

const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || '';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────
// Token Info
// ──────────────────────────────────────────

export async function fetchTokenInfo(address: string): Promise<TokenInfo> {
  const provider = getBscProvider();
  
  // Check if address has code (is a contract)
  const code = await provider.getCode(address);
  if (code === '0x') {
    throw new Error(`Address ${address.slice(0, 10)}... is not a contract (EOA or empty)`);
  }

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

  // Try to get creation info
  let creationBlock: number | undefined;
  let creator: string | undefined;
  try {
    const creationUrl = `${BSCSCAN_API}module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${BSCSCAN_KEY}`;
    const creationRes = await fetch(creationUrl);
    const creationData = await creationRes.json();
    if (creationData.status === '1' && creationData.result?.[0]) {
      creator = creationData.result[0].contractCreator;
    }
  } catch (e) {
    console.error('Creation info fetch error:', e);
  }

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
    creator,
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
    const url = `${BSCSCAN_API}module=contract&action=getsourcecode&address=${address}&apikey=${BSCSCAN_KEY}`;
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
    const url = `${BSCSCAN_API}module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=${count}&apikey=${BSCSCAN_KEY}`;
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
    const url = `${BSCSCAN_API}module=account&action=tokentx&contractaddress=${tokenAddress}&page=1&offset=50&sort=desc&apikey=${BSCSCAN_KEY}`;
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
// Honeypot Detection (via Honeypot.is API)
// ──────────────────────────────────────────

export async function checkHoneypot(tokenAddress: string): Promise<HoneypotResult> {
  const isBinancePegged = !!BINANCE_PEGGED_TOKENS[tokenAddress.toLowerCase()];

  try {
    const url = `https://api.honeypot.is/v2/IsHoneypot?address=${tokenAddress}&chainID=56`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { isHoneypot: false, buyTax: 0, sellTax: 0, error: 'API unavailable' };
    const data = await res.json();

    const rawIsHoneypot = data.honeypotResult?.isHoneypot ?? false;
    const buyTax = (data.simulationResult?.buyTax ?? 0) * 100;
    const sellTax = (data.simulationResult?.sellTax ?? 0) * 100;

    // Override honeypot false positives for known Binance-pegged tokens
    // The honeypot.is API often fails on proxy/upgradeable contracts
    if (isBinancePegged && rawIsHoneypot) {
      return {
        isHoneypot: false,
        buyTax: 0,
        sellTax: 0,
        error: 'Honeypot API returned false positive for known Binance-pegged token — overridden',
      };
    }

    return { isHoneypot: rawIsHoneypot, buyTax, sellTax };
  } catch (e: any) {
    return { isHoneypot: false, buyTax: 0, sellTax: 0, error: e.message };
  }
}

// ──────────────────────────────────────────
// Contract Pattern Analysis (static)
// ──────────────────────────────────────────

export function analyzeContractPatterns(sourceCode?: string): ContractPatterns {
  const result: ContractPatterns = {
    hasProxy: false,
    hasMintFunction: false,
    hasBlacklist: false,
    hasPausable: false,
    hasFeeModification: false,
    hasMaxTxLimit: false,
    hasAntiBot: false,
    hasHiddenOwner: false,
    suspiciousPatterns: [],
  };

  if (!sourceCode) return result;

  const code = sourceCode.toLowerCase();

  result.hasProxy = /delegatecall|upgradeable|transparent.*proxy|beacon.*proxy/.test(code);
  result.hasMintFunction = /function\s+mint\s*\(/.test(code) && !/\/\/.*mint/.test(code);
  result.hasBlacklist = /blacklist|blocklist|isblacklisted|_isexcluded|isbotaddress|isbot/.test(code);
  result.hasPausable = /whennotpaused|pausable|function\s+pause\s*\(/.test(code);
  result.hasFeeModification = /setfee|settax|updatefee|_taxfee|_liquidityfee|setsellfee|setbuyfee/.test(code);
  result.hasMaxTxLimit = /maxtxamount|_maxtxamount|maxtransaction|maxwalletsize/.test(code);
  result.hasAntiBot = /antibot|antibotactive|tradingactive|tradingopen|cantradestart/.test(code);
  result.hasHiddenOwner = /transferownership.*internal|_previousowner/.test(code);

  // Suspicious patterns
  if (/selfdestruct|suicide/.test(code)) result.suspiciousPatterns.push('Contains selfdestruct');
  if (/assembly\s*\{[\s\S]*?sstore/.test(code)) result.suspiciousPatterns.push('Uses raw assembly storage writes');
  if (/block\.number\s*[<>]/.test(code) && /require/.test(code)) result.suspiciousPatterns.push('Block-number-based restrictions (possible sniper protection or time bomb)');
  if (/approve.*type\(uint256\)\.max/.test(code) || /approve.*115792/.test(code)) result.suspiciousPatterns.push('Unlimited approval patterns detected');

  return result;
}

// ──────────────────────────────────────────
// LP Lock Detection
// ──────────────────────────────────────────

const KNOWN_LOCKERS: Record<string, string> = {
  '0x407993575c91ce7643a4d4ccafc9a98c36ee1bbe': 'PinkLock',
  '0xc765bddb93b0d1c1a88282ba0fa6b2d00e3e0c83': 'Mudra Lock',
  '0x71b5759d73262fbb223956913ecf4ecc51057641': 'Unicrypt',
  '0xdead000000000000000042069420694206942069': 'Burned (Team Finance)',
};

export async function checkLPLocks(pairAddress: string): Promise<LPLockInfo> {
  if (!pairAddress || pairAddress === ethers.ZeroAddress) {
    return { isLocked: false, lockedPercent: 0 };
  }
  const provider = getBscProvider();
  const pair = new ethers.Contract(pairAddress, ['function balanceOf(address) view returns (uint256)', 'function totalSupply() view returns (uint256)'], provider);

  try {
    const totalLP = await pair.totalSupply();
    if (totalLP === 0n) return { isLocked: false, lockedPercent: 0 };

    let totalLocked = 0n;
    let platform: string | undefined;

    // Check known locker contracts and burn addresses
    const addressesToCheck = [
      ...Object.keys(KNOWN_LOCKERS),
      ...DEAD_ADDRESSES,
    ];

    const balances = await Promise.all(
      addressesToCheck.map(addr => pair.balanceOf(addr).catch(() => 0n))
    );

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0n) {
        totalLocked += balances[i];
        if (i < Object.keys(KNOWN_LOCKERS).length) {
          platform = Object.values(KNOWN_LOCKERS)[i];
        } else {
          platform = platform || 'Burned';
        }
      }
    }

    const lockedPercent = Number((totalLocked * 10000n) / totalLP) / 100;
    return {
      isLocked: lockedPercent > 50,
      lockedPercent,
      lockPlatform: platform,
    };
  } catch {
    return { isLocked: false, lockedPercent: 0 };
  }
}

// ──────────────────────────────────────────
// Contract Age
// ──────────────────────────────────────────

export async function fetchContractAge(address: string): Promise<string | undefined> {
  try {
    // Get first transaction to contract
    const url = `${BSCSCAN_API}module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${BSCSCAN_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && data.result?.[0]) {
      const timestamp = Number(data.result[0].timeStamp) * 1000;
      const ageMs = Date.now() - timestamp;
      const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      if (days > 365) return `${Math.floor(days / 365)} years, ${days % 365} days`;
      if (days > 30) return `${Math.floor(days / 30)} months, ${days % 30} days`;
      return `${days} days`;
    }
  } catch {}
  return undefined;
}

// ──────────────────────────────────────────
// Aggregate all data for analysis
// ──────────────────────────────────────────

export async function fetchAllTokenData(address: string) {
  const tokenInfo = await fetchTokenInfo(address);
  
  const totalSupply = BigInt(tokenInfo.totalSupply);
  
  // Analyze contract patterns from source code
  const contractPatterns = analyzeContractPatterns(tokenInfo.sourceCode);
  
  // Stagger BSCScan calls slightly to avoid 5/sec rate limit
  const [holders, liquidity, transfers, honeypot, contractAge] = await Promise.all([
    fetchTopHolders(address, totalSupply, tokenInfo.decimals),
    sleep(250).then(() => fetchLiquidity(address)),
    sleep(500).then(() => fetchRecentTransfers(address)),
    checkHoneypot(address),
    sleep(750).then(() => fetchContractAge(address)),
  ]);

  tokenInfo.contractAge = contractAge;

  // Check LP locks for the primary pair
  let lpLock: LPLockInfo = { isLocked: false, lockedPercent: 0 };
  if (liquidity.length > 0) {
    lpLock = await checkLPLocks(liquidity[0].pair);
    // Update liquidity info with lock status
    if (lpLock.isLocked) {
      liquidity[0].isLocked = true;
      liquidity[0].lockExpiry = lpLock.lockExpiry;
    }
  }

  // Tag if it's a known Binance-pegged token
  const isBinancePegged = !!BINANCE_PEGGED_TOKENS[address.toLowerCase()];

  return {
    tokenInfo,
    holders,
    liquidity,
    transfers,
    honeypot,
    contractPatterns,
    lpLock,
    isBinancePegged,
  };
}
