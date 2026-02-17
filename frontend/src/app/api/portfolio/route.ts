import { NextRequest } from 'next/server';
import { ethers } from 'ethers';
import { getBscProvider, ERC20_ABI, BINANCE_PEGGED_TOKENS } from '@/lib/chain';
import { withSecurityHeaders } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Popular BSC tokens to check balances for
const POPULAR_TOKENS = [
  { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', name: 'PancakeSwap', symbol: 'CAKE' },
  { address: '0x55d398326f99059fF775485246999027B3197955', name: 'Tether USD', symbol: 'USDT' },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USD Coin', symbol: 'USDC' },
  { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', name: 'BUSD', symbol: 'BUSD' },
  { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', name: 'Ethereum', symbol: 'ETH' },
  { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', name: 'Bitcoin BEP2', symbol: 'BTCB' },
  { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', name: 'XRP', symbol: 'XRP' },
  { address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', name: 'ChainLink', symbol: 'LINK' },
  { address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', name: 'Polkadot', symbol: 'DOT' },
  { address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003', name: 'Trust Wallet', symbol: 'TWT' },
  { address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', name: 'Dogecoin', symbol: 'DOGE' },
  { address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', name: 'SHIBA INU', symbol: 'SHIB' },
  { address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E', name: 'FLOKI', symbol: 'FLOKI' },
  { address: '0xc748673057861a797275CD8A068AbB95A902e8de', name: 'Baby Doge Coin', symbol: 'BabyDoge' },
  { address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', name: 'Venus', symbol: 'XVS' },
  { address: '0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F', name: 'Alpaca Finance', symbol: 'ALPACA' },
  { address: '0xD41FDb03Ba84762dD66a0af1a6C8540FF1ba5dfb', name: 'SafePal', symbol: 'SFP' },
  { address: '0xaEC945e04baF28b135Fa7c640f624f8D90F1C3a6', name: 'Coin98', symbol: 'C98' },
  { address: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF', name: 'Solana', symbol: 'SOL' },
  { address: '0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B', name: 'TRON', symbol: 'TRX' },
];

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address || !ethers.isAddress(address)) {
    const res = new Response(
      JSON.stringify({ error: 'Invalid wallet address' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  }

  try {
    const provider = getBscProvider();
    const normalizedAddress = ethers.getAddress(address);

    // Check BNB balance
    const bnbBalance = await provider.getBalance(normalizedAddress);

    // Check balances of popular tokens in parallel
    const results = await Promise.all(
      POPULAR_TOKENS.map(async (token) => {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const [balance, decimals] = await Promise.all([
            contract.balanceOf(normalizedAddress),
            contract.decimals().catch(() => 18),
          ]);
          if (balance > 0n) {
            return {
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              balance: ethers.formatUnits(balance, decimals),
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const tokens = results.filter(Boolean);

    // Add BNB if they have any
    if (bnbBalance > 0n) {
      tokens.unshift({
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB for scanning
        name: 'BNB',
        symbol: 'BNB',
        balance: ethers.formatEther(bnbBalance),
      });
    }

    const res = new Response(
      JSON.stringify({ tokens }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  } catch (err) {
    const res = new Response(
      JSON.stringify({ error: 'Failed to fetch portfolio' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    return withSecurityHeaders(res, req);
  }
}
