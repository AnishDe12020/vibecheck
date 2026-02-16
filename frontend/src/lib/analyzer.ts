import type { VibeCheckReport, RiskCategory, TokenInfo, HolderInfo, LiquidityInfo } from './types';

interface AnalysisInput {
  tokenInfo: TokenInfo;
  holders: HolderInfo[];
  liquidity: LiquidityInfo[];
  transfers: any[];
}

export async function analyzeToken(input: AnalysisInput): Promise<VibeCheckReport> {
  const { tokenInfo, holders, liquidity, transfers } = input;

  const totalLiquidityUSD = liquidity.reduce((sum, l) => sum + l.liquidityUSD, 0);
  const top10HolderPct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  const burnedPct = holders
    .filter(h => h.label?.includes('Burn') || h.label?.includes('Dead'))
    .reduce((sum, h) => sum + h.percentage, 0);

  const prompt = buildAnalysisPrompt(tokenInfo, holders, liquidity, transfers, {
    totalLiquidityUSD,
    top10HolderPct,
    burnedPct,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  return parseAnalysisResponse(text, tokenInfo, holders, liquidity);
}

function buildAnalysisPrompt(
  token: TokenInfo,
  holders: HolderInfo[],
  liquidity: LiquidityInfo[],
  transfers: any[],
  stats: { totalLiquidityUSD: number; top10HolderPct: number; burnedPct: number }
): string {
  const holderSummary = holders.slice(0, 15).map((h, i) =>
    `  ${i + 1}. ${h.address.slice(0, 10)}...${h.address.slice(-6)} — ${h.percentage.toFixed(2)}%${h.label ? ` (${h.label})` : ''}`
  ).join('\n');

  const liqSummary = liquidity.map(l =>
    `  ${l.dex}: $${l.liquidityUSD.toFixed(0)} USD (Locked: ${l.isLocked ? 'Yes' : 'Unknown'})`
  ).join('\n') || '  No liquidity found on PancakeSwap';

  const largeTxs = transfers
    .filter(tx => {
      const value = Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal || 18));
      const supply = Number(token.totalSupply) / Math.pow(10, token.decimals);
      return supply > 0 && (value / supply) > 0.01;
    })
    .slice(0, 10)
    .map(tx => {
      const value = Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal || 18));
      return `  ${tx.from.slice(0, 10)}→${tx.to.slice(0, 10)} | ${value.toFixed(2)} tokens | Block ${tx.blockNumber}`;
    })
    .join('\n') || '  No large transfers detected';

  const sourceSection = token.isVerified && token.sourceCode
    ? `\nCONTRACT SOURCE CODE (first 8000 chars):\n\`\`\`solidity\n${token.sourceCode.slice(0, 8000)}\n\`\`\``
    : '\nCONTRACT SOURCE: ⚠️ NOT VERIFIED on BSCScan — this is a red flag.';

  return `You are VibeCheck, an AI token safety auditor for BSC (BNB Smart Chain) tokens. Analyze this token and provide a safety assessment.

TOKEN: ${token.name} (${token.symbol})
ADDRESS: ${token.address}
TOTAL SUPPLY: ${token.totalSupply}
OWNER: ${token.owner || 'Unknown / Renounced'}
VERIFIED: ${token.isVerified ? 'Yes' : 'No'}
${sourceSection}

TOP HOLDERS:
${holderSummary}
  Top 10 hold: ${stats.top10HolderPct.toFixed(1)}% | Burned: ${stats.burnedPct.toFixed(1)}%

LIQUIDITY:
${liqSummary}
  Total: $${stats.totalLiquidityUSD.toFixed(0)} USD

RECENT LARGE TRANSFERS (>1% supply):
${largeTxs}

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <0-100, 100=safest>,
  "riskLevel": "<SAFE|CAUTION|DANGER|CRITICAL>",
  "summary": "<2-3 sentence plain English summary of the token's safety>",
  "recommendation": "<1 sentence recommendation for a potential buyer>",
  "contract": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<finding 1>", "<finding 2>", ...]
  },
  "concentration": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<finding 1>", "<finding 2>", ...]
  },
  "liquidity": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<finding 1>", "<finding 2>", ...]
  },
  "trading": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<finding 1>", "<finding 2>", ...]
  },
  "flags": ["<red flag 1>", "<green flag 1>", ...]
}

SCORING GUIDE:
- 80-100 SAFE: Well-known token, verified contract, good distribution, deep liquidity
- 50-79 CAUTION: Some concerns but not immediately dangerous
- 20-49 DANGER: Multiple red flags, high risk of loss
- 0-19 CRITICAL: Almost certainly a scam/rug pull

Be specific in findings. Reference actual data from the token info. Don't be generic.`;
}

function parseAnalysisResponse(
  text: string,
  tokenInfo: TokenInfo,
  holders: HolderInfo[],
  liquidity: LiquidityInfo[]
): VibeCheckReport {
  let parsed: any;
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return createFallbackReport(tokenInfo, holders, liquidity);
  }

  const mkCategory = (cat: any, name: string): RiskCategory => ({
    name,
    score: Math.min(100, Math.max(0, cat?.score ?? 50)),
    level: cat?.level ?? 'caution',
    findings: Array.isArray(cat?.findings) ? cat.findings : [],
  });

  return {
    token: tokenInfo,
    overallScore: Math.min(100, Math.max(0, parsed.overallScore ?? 50)),
    riskLevel: parsed.riskLevel ?? 'CAUTION',
    summary: parsed.summary ?? 'Analysis could not be completed.',
    categories: {
      contract: mkCategory(parsed.contract, 'Contract Safety'),
      concentration: mkCategory(parsed.concentration, 'Holder Concentration'),
      liquidity: mkCategory(parsed.liquidity, 'Liquidity Health'),
      trading: mkCategory(parsed.trading, 'Trading Patterns'),
    },
    topHolders: holders,
    liquidity,
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    recommendation: parsed.recommendation ?? 'Do your own research.',
    timestamp: Date.now(),
  };
}

function createFallbackReport(
  tokenInfo: TokenInfo,
  holders: HolderInfo[],
  liquidity: LiquidityInfo[]
): VibeCheckReport {
  return {
    token: tokenInfo,
    overallScore: 30,
    riskLevel: 'DANGER',
    summary: 'AI analysis encountered an error. Limited data-based assessment: exercise extreme caution.',
    categories: {
      contract: { name: 'Contract Safety', score: tokenInfo.isVerified ? 50 : 10, level: tokenInfo.isVerified ? 'caution' : 'critical', findings: [tokenInfo.isVerified ? 'Contract is verified' : 'Contract is NOT verified — major red flag'] },
      concentration: { name: 'Holder Concentration', score: 50, level: 'caution', findings: ['Could not fully analyze'] },
      liquidity: { name: 'Liquidity Health', score: liquidity.length > 0 ? 50 : 10, level: liquidity.length > 0 ? 'caution' : 'critical', findings: [liquidity.length > 0 ? 'Liquidity exists on PancakeSwap' : 'No liquidity found'] },
      trading: { name: 'Trading Patterns', score: 50, level: 'caution', findings: ['Could not fully analyze'] },
    },
    topHolders: holders,
    liquidity,
    flags: ['⚠️ Analysis incomplete — exercise caution'],
    recommendation: 'Analysis failed to complete. Do not invest without further research.',
    timestamp: Date.now(),
  };
}
