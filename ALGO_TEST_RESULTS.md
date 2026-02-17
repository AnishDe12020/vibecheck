# VibeCheck Algorithm Test Results

**Date:** 2026-02-17  
**API:** https://vibecheck-bsc.vercel.app/api/scan-stream  
**Tokens Tested:** 53 (43 returned results, 10 returned no data)

---

## Summary Table

| # | Token | Score | Risk Level | Expected | Match? |
|---|-------|-------|-----------|----------|--------|
| **Blue Chips (expect 70+)** |||||
| 1 | WBNB | 100 | SAFE | 70+ | ✅ |
| 2 | CAKE | 95 | SAFE | 70+ | ✅ |
| 3 | BUSD | 98 | SAFE | 70+ | ✅ |
| 4 | USDT | 98 | SAFE | 70+ | ✅ |
| 5 | USDC | 95 | SAFE | 70+ | ✅ |
| 6 | ETH (BSC) | 95 | SAFE | 70+ | ✅ |
| 7 | BTCB | 95 | SAFE | 70+ | ✅ |
| 8 | **XRP (BSC)** | **5** | **CRITICAL** | 70+ | ❌ FALSE POSITIVE |
| 9 | DOT (BSC) | 92 | SAFE | 70+ | ✅ |
| 10 | **LINK (BSC)** | **5** | **CRITICAL** | 70+ | ❌ FALSE POSITIVE |
| **DeFi (expect 60-85)** |||||
| 11 | XVS | 88 | SAFE | 60-85 | ✅ (slightly high) |
| 12 | ALPACA | 82 | SAFE | 60-85 | ✅ |
| 13 | **BAKE** | **38** | **DANGER** | 60-85 | ❌ FALSE POSITIVE |
| 14 | **TWT** | **5** | **CRITICAL** | 60-85 | ❌ FALSE POSITIVE |
| 15 | BABY | 88 | SAFE | 60-85 | ✅ (slightly high) |
| **Memecoins (expect 30-70)** |||||
| 16 | **DOGE (BSC)** | **5** | **CRITICAL** | 30-70 | ❌ FALSE POSITIVE |
| 17 | SHIB (BSC) | 52 | CAUTION | 30-70 | ✅ |
| 18 | FLOKI | 38 | DANGER | 30-70 | ✅ |
| 19 | BabyDoge | 68 | CAUTION | 30-70 | ✅ |
| 20 | SafeMoon V2 | 38 | DANGER | 30-70 | ✅ |
| **Known Scams (expect <30)** |||||
| 21 | SquidGame | ERROR | — | <30 | ⚠️ No data |
| 22 | SafeMoon OLD | 12 | CRITICAL | <30 | ✅ |
| 23 | SaveTheKids | ERROR | — | <30 | ⚠️ No data |
| 24 | MeerkatFinance | ERROR | — | <30 | ⚠️ No data |
| 25 | TurtleDEX | ERROR | — | <30 | ⚠️ No data |
| 26 | CompounderFin | ERROR | — | <30 | ⚠️ No data |
| 27 | StableMagnet | ERROR | — | <30 | ⚠️ No data |
| 28 | Honeypot Example | 8 | CRITICAL | <30 | ✅ |
| **Bridge / Wrapped** |||||
| 29 | **axlUSDC** | **5** | **CRITICAL** | 50-80 | ❌ (dead bridge, arguably correct) |
| 30 | anyUSDC | 35 | DANGER | 30-60 | ✅ (defunct bridge) |
| 31 | BETH | 92 | SAFE | 60-80 | ✅ |
| **Mid/Small Caps** |||||
| 32 | RACA | 68 | CAUTION | 40-70 | ✅ |
| 33 | HIGH | ERROR | — | 40-70 | ⚠️ No data |
| 34 | SANTOS | ERROR | — | 40-70 | ⚠️ No data |
| 35 | LAZIO | ERROR | — | 40-70 | ⚠️ No data |
| **Exploited/Dead Projects** |||||
| 36 | BUNNY | 42 | DANGER | <40 | ✅ (close) |
| 37 | IDIA | 65 | CAUTION | 40-60 | ✅ (slightly high) |
| 38 | EPS | 62 | CAUTION | 30-50 | ⚠️ Higher than expected |
| 39 | BELT | 58 | CAUTION | 30-50 | ⚠️ Higher than expected |
| **Additional Tokens** |||||
| 40 | SFP | 92 | SAFE | 50-75 | ⚠️ Higher than expected |
| 41 | C98 | 62 | CAUTION | 50-75 | ✅ |
| 42 | MBOX | 68 | CAUTION | 40-65 | ✅ (slightly high) |
| 43 | **WIN** | **38** | **DANGER** | 30-60 | ✅ |
| 44 | **TRX (BSC)** | **5** | **CRITICAL** | 50-75 | ❌ FALSE POSITIVE |
| 45 | ADA (BSC) | 88 | SAFE | 60-80 | ✅ (slightly high) |
| 46 | **MATIC (BSC)** | **38** | **DANGER** | 60-80 | ❌ FALSE POSITIVE |
| 47 | AVAX (BSC) | 92 | SAFE | 60-80 | ✅ |
| 48 | **FIL (BSC)** | **5** | **CRITICAL** | 50-75 | ❌ FALSE POSITIVE |
| 49 | **ATOM (BSC)** | **38** | **DANGER** | 60-80 | ❌ FALSE POSITIVE |
| 50 | **LTC (BSC)** | **5** | **CRITICAL** | 60-80 | ❌ FALSE POSITIVE |
| 51 | DODO | 55 | CAUTION | 40-65 | ✅ |
| 52 | LINA | 38 | DANGER | 30-55 | ✅ |
| 53 | AUCTION | 5 | CRITICAL | 40-65 | ❌ (may be dead token) |

---

## Accuracy Statistics

### Overall (excluding no-data errors, N=43)

- **Correct (within expected range):** 24/43 = **55.8%**
- **False Positives (legit tokens flagged as scams):** 11/43 = **25.6%**
- **Slightly off (close to expected):** 5/43 = **11.6%**
- **Other mismatches:** 3/43 = **7.0%**

### By Category

| Category | Tested | With Results | Correct | Accuracy |
|----------|--------|-------------|---------|----------|
| Blue Chips | 10 | 10 | 8 | 80% |
| DeFi | 5 | 5 | 3 | 60% |
| Memecoins | 5 | 5 | 4 | 80% |
| Scams | 8 | 2 | 2 | 100% (but 6 returned no data) |
| Bridge/Wrapped | 7 (+4 extra) | 9 | 4 | 44% |
| Mid/Small Caps | 8 | 5 | 4 | 80% |
| Dead Projects | 4 | 4 | 2 | 50% |

---

## Critical False Positives (Legit tokens scored CRITICAL/DANGER)

These are the **most damaging errors** — telling users that legitimate Binance-pegged blue chips are scams:

| Token | Score | Reason Given by Algorithm |
|-------|-------|--------------------------|
| **XRP (BSC)** | 5 | "Honeypot detected: CANNOT SELL", "Hidden owner functionality" |
| **LINK (BSC)** | 5 | "Honeypot detected: users cannot sell", "Impersonating ChainLink" |
| **TWT** | 5 | "Honeypot detected", "Impersonation of official Trust Wallet Token" |
| **DOGE (BSC)** | 5 | "HONEYPOT DETECTED: Cannot sell tokens", "Proxy contract" |
| **TRX (BSC)** | 5 | "HONEYPOT: Users cannot sell", "Fake Token" |
| **FIL (BSC)** | 5 | "HONEYPOT: Users are unable to sell tokens" |
| **LTC (BSC)** | 5 | "Honeypot detected: Sell transactions are failing" |
| **BAKE** | 38 | "Extremely low liquidity ($1,553)" — actual DeFi token |
| **MATIC (BSC)** | 38 | "Upgradeable Proxy", "Critically low liquidity ($2,815)" |
| **ATOM (BSC)** | 38 | "Owner can mint", "Critically low liquidity ($7,302)" |

### Root Cause Pattern

The algorithm has a **systematic problem with Binance-pegged tokens that use proxy/upgradeable contracts**. Many official Binance bridge tokens use:
- Proxy patterns (for upgradeability)
- Mint functions (for bridge operations)
- Owner-controlled logic

The algorithm treats these as red flags and in some cases declares them **honeypots** — likely because:
1. **Honeypot simulation fails** on proxy tokens (the sell test may not work correctly through proxies)
2. **LLM over-interprets** proxy patterns as malicious when they're standard bridge architecture
3. **No whitelist/recognition** of official Binance bridge deployer addresses

### Interesting Split

The algorithm correctly handles SOME Binance-pegged tokens (WBNB, BUSD, USDT, USDC, ETH, BTCB, DOT, ADA, AVAX) but fails on others (XRP, LINK, DOGE, TWT, TRX, FIL, LTC). This suggests the issue is **inconsistent** — possibly related to:
- Contract complexity/size differences between tokens
- Whether the proxy pattern is recognized
- Liquidity depth (lower liquidity Binance pegs fail more often)

---

## False Negatives (Scam tokens scored too high)

- **Most scam tokens returned no data** (6/8), which means the API can't scan unverified contracts at all
- Of the 2 scams that returned data: SafeMoon OLD (12) and Honeypot Example (8) — both correctly flagged ✅
- **No clear false negatives found** — the algorithm is aggressive enough to catch bad tokens

---

## API Error Rate

- **10/53 tokens returned no data (18.9%)**
- All were either known scams (unverified contracts) or smaller tokens
- This is arguably correct behavior for unverified contracts, but the API should return an explicit error/warning rather than empty response

---

## Recommendations for Algorithm Improvements

### 🔴 P0 — Critical: Fix Binance-Peg Proxy Token False Positives
1. **Maintain a whitelist of known Binance bridge deployer addresses** — tokens deployed by Binance's bridge infrastructure should get a trust boost
2. **Fix honeypot simulation for proxy contracts** — the sell simulation is likely failing on proxy patterns, causing false honeypot detection
3. **Distinguish between malicious proxies and legitimate bridge proxies** — check deployer address, creation date, holder count as signals

### 🟡 P1 — Important: Better handling of low-liquidity legitimate tokens  
4. BAKE, MATIC, ATOM scored poorly mainly due to low liquidity — but low liquidity on BSC doesn't mean scam if the token trades mainly on other chains/CEXs
5. Add cross-reference: if token matches a known CoinGecko/CMC listing, boost the score even with low on-chain liquidity

### 🟢 P2 — Nice to Have
6. Return explicit error responses for unverified/unscannable contracts instead of empty stream
7. Consider adding a "confidence" field — e.g., "we couldn't fully simulate this proxy contract, confidence is low"
8. The FLOKI tax detection (59% round-trip) may be incorrect — FLOKI has 3% buy/3% sell tax, not 59%
9. The AUCTION address returned "TRYfinance" — wrong token at that address? Verify address mappings

### 📊 Score Calibration
- Blue chips with proxy patterns: Currently 5-38 → Should be 60-80 (flagging proxy risk but not declaring scam)
- Dead/exploited projects: Currently 42-62 → Appropriate range, could be slightly lower
- The 5/100 score is too binary — legitimate tokens with concerning patterns should get 30-50, not 5
