import type { VibeCheckReport, RiskCategory, TokenInfo, HolderInfo, LiquidityInfo, HoneypotResult, ContractPatterns, LPLockInfo } from './types';

interface AnalysisInput {
  tokenInfo: TokenInfo;
  holders: HolderInfo[];
  liquidity: LiquidityInfo[];
  transfers: any[];
  honeypot: HoneypotResult;
  contractPatterns: ContractPatterns;
  lpLock: LPLockInfo;
  isBinancePegged?: boolean;
}

export async function analyzeToken(input: AnalysisInput): Promise<VibeCheckReport> {
  const { tokenInfo, holders, liquidity, transfers, honeypot, contractPatterns, lpLock, isBinancePegged } = input;

  const totalLiquidityUSD = liquidity.reduce((sum, l) => sum + l.liquidityUSD, 0);
  const top10HolderPct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  const burnedPct = holders
    .filter(h => h.label?.includes('Burn') || h.label?.includes('Dead'))
    .reduce((sum, h) => sum + h.percentage, 0);

  const prompt = buildAnalysisPrompt(tokenInfo, holders, liquidity, transfers, {
    totalLiquidityUSD,
    top10HolderPct,
    burnedPct,
  }, honeypot, contractPatterns, lpLock, isBinancePegged);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
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
  stats: { totalLiquidityUSD: number; top10HolderPct: number; burnedPct: number },
  honeypot: HoneypotResult,
  patterns: ContractPatterns,
  lpLock: LPLockInfo,
  isBinancePegged?: boolean
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

  // Build honeypot section
  const honeypotSection = honeypot.error
    ? `\nHONEYPOT CHECK: Could not verify (${honeypot.error})`
    : `\nHONEYPOT CHECK:
  Is Honeypot: ${honeypot.isHoneypot ? '🚨 YES — CANNOT SELL' : 'No'}
  Buy Tax: ${honeypot.buyTax.toFixed(1)}%
  Sell Tax: ${honeypot.sellTax.toFixed(1)}%
  ${honeypot.buyTax > 10 || honeypot.sellTax > 10 ? '⚠️ HIGH TAX DETECTED' : ''}
  ${honeypot.sellTax > 50 ? '🚨 EXTREME SELL TAX — likely a honeypot variant' : ''}`;

  // Build contract patterns section
  const patternFlags = [];
  if (patterns.hasProxy) patternFlags.push('🚨 Proxy/Upgradeable contract (logic can be changed)');
  if (patterns.hasMintFunction) patternFlags.push('⚠️ Has mint function (can create new tokens)');
  if (patterns.hasBlacklist) patternFlags.push('⚠️ Has blacklist functionality (can block addresses)');
  if (patterns.hasPausable) patternFlags.push('⚠️ Pausable (can freeze all transfers)');
  if (patterns.hasFeeModification) patternFlags.push('⚠️ Fees can be modified by owner');
  if (patterns.hasMaxTxLimit) patternFlags.push('Has max transaction limit');
  if (patterns.hasAntiBot) patternFlags.push('Has anti-bot mechanisms');
  if (patterns.hasHiddenOwner) patternFlags.push('🚨 Hidden owner pattern detected');
  patterns.suspiciousPatterns.forEach(p => patternFlags.push(`🚨 ${p}`));
  
  const patternsSection = patternFlags.length > 0
    ? `\nCONTRACT PATTERNS DETECTED:\n${patternFlags.map(f => `  - ${f}`).join('\n')}`
    : '\nCONTRACT PATTERNS: No concerning patterns found in source code';

  // LP Lock section
  const lpLockSection = lpLock.lockedPercent > 0
    ? `\nLP LOCK STATUS: ${lpLock.lockedPercent.toFixed(1)}% locked${lpLock.lockPlatform ? ` via ${lpLock.lockPlatform}` : ''}${lpLock.isLocked ? ' ✅' : ' (partial)'}`
    : `\nLP LOCK STATUS: ⚠️ No LP tokens found in known lock contracts or burn addresses`;

  const ageSection = token.contractAge ? `\nCONTRACT AGE: ${token.contractAge}` : '';

  const binancePeggedSection = isBinancePegged
    ? `\n⚠️ IMPORTANT: This is an OFFICIAL Binance-Pegged token. It is a legitimate bridge token created by Binance. Do NOT flag it as a scam, impersonation, or honeypot. Proxy/upgradeable patterns are normal for Binance bridge infrastructure. If the honeypot API returned a false positive, IGNORE it. Score this token based on its actual fundamentals (liquidity, holders, etc).`
    : '';

  return `You are VibeCheck, an AI token safety auditor for BSC (BNB Smart Chain) tokens. Analyze this token and provide a safety assessment.${binancePeggedSection}

TOKEN: ${token.name} (${token.symbol})
ADDRESS: ${token.address}
TOTAL SUPPLY: ${token.totalSupply}
OWNER: ${token.owner || 'Unknown / Renounced'}
CREATOR: ${token.creator || 'Unknown'}
VERIFIED: ${token.isVerified ? 'Yes' : 'No'}${ageSection}
${sourceSection}
${patternsSection}
${honeypotSection}

TOP HOLDERS:
${holderSummary}
  Top 10 hold: ${stats.top10HolderPct.toFixed(1)}% | Burned: ${stats.burnedPct.toFixed(1)}%

LIQUIDITY:
${liqSummary}
  Total: $${stats.totalLiquidityUSD.toFixed(0)} USD${lpLockSection}

RECENT LARGE TRANSFERS (>1% supply):
${largeTxs}

SCORING RULES (follow strictly):
1. If honeypot detected AND token is NOT a known major token → overallScore ≤ 10, riskLevel = CRITICAL
2. If sell tax > 30% → overallScore ≤ 15, riskLevel = CRITICAL  
3. If unverified contract → contract score ≤ 30
4. If proxy/upgradeable contract → contract score ≤ 40 (unless well-known project)
5. If owner can mint → contract score ≤ 50
6. If top non-burn holder > 50% → concentration score ≤ 20
7. If top non-burn holder > 20% → concentration score ≤ 50
8. If no liquidity → liquidity score ≤ 10
9. If liquidity < $10,000 → liquidity score ≤ 40
10. If LP not locked/burned → liquidity score ≤ 60
11. If buy+sell tax > 10% combined → trading score ≤ 50
12. If contract age < 7 days → additional -10 to overall score
13. Blue-chip infrastructure (WBNB, BUSD, USDT, CAKE etc) → 90-100

NUANCE RULES (important — avoid binary scoring):
- Proxy/upgradeable contracts used by major protocols (Axelar, Binance bridge, LayerZero, Multichain) are NORMAL — don't penalize unless there are other red flags.
- For tokens with low DEX liquidity but verified contracts and good holder distribution, score liquidity low but don't let it drag the overall score below 40.
- The overall score should be a WEIGHTED AVERAGE of categories: contract 30%, concentration 25%, liquidity 25%, trading 20%.
- Scores of 5 or below are ONLY for confirmed honeypots or tokens with multiple critical failures (e.g. honeypot + unverified + no liquidity).
- Most legitimate tokens should score between 30-80. Reserve 90+ for blue-chip only. Use the full range.

Risk level mapping: SAFE (70-100), CAUTION (50-69), DANGER (25-49), CRITICAL (0-24)

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <0-100>,
  "riskLevel": "<SAFE|CAUTION|DANGER|CRITICAL>",
  "summary": "<2-3 sentence plain English summary>",
  "recommendation": "<1 sentence actionable recommendation>",
  "contract": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<specific finding referencing actual data>", ...]
  },
  "concentration": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<specific finding referencing actual data>", ...]
  },
  "liquidity": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<specific finding referencing actual data>", ...]
  },
  "trading": {
    "score": <0-100>,
    "level": "<safe|caution|danger|critical>",
    "findings": ["<specific finding referencing actual data>", ...]
  },
  "flags": ["🔴 <red flag>", "🟢 <green flag>", ...]
}

IMPORTANT: Be specific — cite actual numbers, addresses, percentages. No generic statements.`;
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
  const totalLiquidityUSD = liquidity.reduce((sum, l) => sum + l.liquidityUSD, 0);
  const top10HolderPct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  const holderCount = holders.length;

  const contractFindings: string[] = [];
  contractFindings.push(tokenInfo.isVerified ? 'Contract is verified on BSCScan' : 'Contract is NOT verified — major red flag');
  if (tokenInfo.owner) contractFindings.push(`Owner: ${tokenInfo.owner.slice(0, 10)}...`);
  else contractFindings.push('Owner: Renounced or unknown');
  if (tokenInfo.contractAge) contractFindings.push(`Contract age: ${tokenInfo.contractAge}`);

  const concentrationFindings: string[] = [];
  if (holderCount > 0) {
    concentrationFindings.push(`Top 10 holders control ${top10HolderPct.toFixed(1)}% of supply`);
    concentrationFindings.push(`${holderCount} holders analyzed`);
  } else {
    concentrationFindings.push('No holder data available');
  }

  const liquidityFindings: string[] = [];
  if (liquidity.length > 0) {
    liquidityFindings.push(`Found ${liquidity.length} liquidity pool(s) — total $${totalLiquidityUSD.toFixed(0)} USD`);
    liquidity.forEach(l => liquidityFindings.push(`${l.dex}: $${l.liquidityUSD.toFixed(0)} (locked: ${l.isLocked ? 'Yes' : 'Unknown'})`));
  } else {
    liquidityFindings.push('No liquidity found on PancakeSwap');
  }

  const concScore = holderCount > 0 ? (top10HolderPct > 50 ? 20 : top10HolderPct > 20 ? 40 : 60) : 30;
  const liqScore = liquidity.length > 0 ? (totalLiquidityUSD > 10000 ? 60 : 40) : 10;

  return {
    token: tokenInfo,
    overallScore: 30,
    riskLevel: 'DANGER',
    summary: `AI analysis failed but raw data was collected. ${tokenInfo.name} (${tokenInfo.symbol}) is ${tokenInfo.isVerified ? 'verified' : 'unverified'} with $${totalLiquidityUSD.toFixed(0)} liquidity and ${holderCount} holders tracked. Exercise caution.`,
    categories: {
      contract: { name: 'Contract Safety', score: tokenInfo.isVerified ? 50 : 10, level: tokenInfo.isVerified ? 'caution' : 'critical', findings: contractFindings },
      concentration: { name: 'Holder Concentration', score: concScore, level: concScore >= 50 ? 'caution' : 'danger', findings: concentrationFindings },
      liquidity: { name: 'Liquidity Health', score: liqScore, level: liqScore >= 40 ? 'caution' : 'critical', findings: liquidityFindings },
      trading: { name: 'Trading Patterns', score: 50, level: 'caution', findings: ['AI analysis failed — trading patterns not evaluated'] },
    },
    topHolders: holders,
    liquidity,
    flags: ['⚠️ AI analysis failed — scores are based on raw data only', ...(tokenInfo.isVerified ? ['🟢 Contract is verified'] : ['🔴 Contract is unverified']), ...(totalLiquidityUSD > 10000 ? ['🟢 Has significant liquidity'] : totalLiquidityUSD > 0 ? ['🟡 Low liquidity'] : ['🔴 No liquidity'])],
    recommendation: 'AI analysis failed to complete. The raw data has been presented but do your own research before investing.',
    timestamp: Date.now(),
  };
}
