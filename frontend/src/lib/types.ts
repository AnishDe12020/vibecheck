export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  isVerified: boolean;
  sourceCode?: string;
  compiler?: string;
  owner?: string;
  creator?: string;
  creationTimestamp?: number;
}

export interface HolderInfo {
  address: string;
  balance: string;
  percentage: number;
  label?: string; // "Deployer", "PancakeSwap", "Dead", etc.
}

export interface LiquidityInfo {
  pair: string;
  dex: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  liquidityUSD: number;
  isLocked: boolean;
  lockExpiry?: number;
}

export interface RiskCategory {
  name: string;
  score: number; // 0-100
  level: 'safe' | 'caution' | 'danger' | 'critical';
  findings: string[];
}

export interface VibeCheckReport {
  token: TokenInfo;
  overallScore: number; // 0-100
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL';
  summary: string; // AI-generated plain english summary
  categories: {
    contract: RiskCategory;
    concentration: RiskCategory;
    liquidity: RiskCategory;
    trading: RiskCategory;
  };
  topHolders: HolderInfo[];
  liquidity: LiquidityInfo[];
  flags: string[]; // Quick red/green flags
  recommendation: string; // AI recommendation
  timestamp: number;
  attestationTx?: string; // opBNB tx hash
}

export type ScanStatus = 'idle' | 'fetching' | 'analyzing' | 'attesting' | 'complete' | 'error';
