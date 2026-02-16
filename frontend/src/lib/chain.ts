import { ethers } from 'ethers';

// BSC Mainnet
export const BSC_RPC = 'https://bsc-dataseed1.binance.org';
export const BSC_CHAIN_ID = 56;

// opBNB Mainnet  
export const OPBNB_RPC = 'https://opbnb-mainnet-rpc.bnbchain.org';
export const OPBNB_CHAIN_ID = 204;

// BSCScan API (v2 / BSCTrace)
export const BSCSCAN_API = 'https://api.bscscan.com/api';

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
  return new ethers.JsonRpcProvider(OPBNB_RPC, undefined, { staticNetwork: true });
}
