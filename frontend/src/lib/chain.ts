import { ethers } from 'ethers';

// BSC Mainnet
export const BSC_RPC = 'https://bsc-dataseed1.binance.org';
export const BSC_CHAIN_ID = 56;

// opBNB Mainnet  
export const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';
export const OPBNB_CHAIN_ID = 204;

// BSCScan API (v2 / BSCTrace)
// BSCScan v2 API (v1 deprecated Jan 2026)
export const BSCSCAN_API = 'https://api.etherscan.io/v2/api?chainid=56&';

// PancakeSwap V2 Router & Factory
export const PANCAKE_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
export const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
export const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
export const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
export const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955';

// Dead addresses (for burn detection)
export const DEAD_ADDRESSES = [
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000001',
];

// Official Binance-Pegged tokens — these are legitimate bridge tokens
// Honeypot detection often fails on these due to proxy patterns
export const BINANCE_PEGGED_TOKENS: Record<string, string> = {
  '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe': 'XRP',
  '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd': 'LINK',
  '0x4b0f1812e5df2a09796481ff14017e6005508003': 'TWT',
  '0xba2ae424d960c26247dd6c32edc70b295c744c43': 'DOGE',
  '0x85eac5ac2f758618dfa09bdbe0cf174e7d574d5b': 'TRX',
  '0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153': 'FIL',
  '0x4338665cbb7b2485a8855a139b75d5e34ab0db94': 'LTC',
  '0x7083609fce4d1d8dc0c979aab8c869ea2c873402': 'DOT',
  '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47': 'ADA',
  '0x1ce0c2827e2ef14d5c4f29a091d735a204794041': 'AVAX',
  '0xa045e37a0d1dd3a45fefb8803d22457abc0a728a': 'MATIC',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': 'BTCB',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': 'ETH',
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'WBNB',
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': 'BUSD',
  '0x55d398326f99059ff775485246999027b3197955': 'USDT',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'USDC',
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': 'CAKE',
  '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63': 'XVS',
  '0x14016e85a25aeb13065688cafb43044c2ef86784': 'TUSD',
  '0x8ff795a6f4d97e7887c79bea79aba5cc76444adf': 'BCH',
  '0x1fa4a73a3f0133f0025378af00236f3abdee5d63': 'NEAR',
  '0xcc42724c6683b7e57334c4e856f4c9965ed682bd': 'MATIC',
  '0x570a5d26f7765ecb712c0924e4de545b89fd43df': 'SOL',
};

// Known labels
export const KNOWN_ADDRESSES: Record<string, string> = {
  [PANCAKE_FACTORY.toLowerCase()]: 'PancakeSwap Factory',
  [PANCAKE_ROUTER.toLowerCase()]: 'PancakeSwap Router',
  [WBNB.toLowerCase()]: 'WBNB',
  [BUSD.toLowerCase()]: 'BUSD',
  [USDT_BSC.toLowerCase()]: 'USDT',
  '0x000000000000000000000000000000000000dead': '🔥 Burn Address',
  '0x0000000000000000000000000000000000000000': '🔥 Zero Address',
};

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
];

// PancakeSwap Factory ABI (minimal)
export const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address)',
];

// PancakeSwap Pair ABI (minimal)
export const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)',
];

// VibeCheck Contract ABI
export const VIBECHECK_ABI = [
  'function submitAttestation(address token, uint8 score, string riskLevel, string reportCID) external',
  'function getAttestations(address token) external view returns (tuple(address token, uint8 score, string riskLevel, string reportCID, uint256 timestamp, address scanner)[])',
  'function getLatestScore(address token) external view returns (uint8 score, string riskLevel, uint256 timestamp)',
  'function totalScans() external view returns (uint256)',
  'function getRecentTokens(uint256 count) external view returns (address[])',
];

export function getBscProvider() {
  return new ethers.JsonRpcProvider(BSC_RPC);
}

export function getOpbnbProvider() {
  return new ethers.JsonRpcProvider(OPBNB_RPC, OPBNB_CHAIN_ID, { staticNetwork: true });
}
