# VibeCheck Algorithm Issues

**Date:** 2026-02-17

---

## Issue #1: CRITICAL — Honeypot False Positive on Binance-Pegged Proxy Tokens

**Affected tokens:** XRP, LINK, TWT, DOGE, TRX, FIL, LTC (all Binance-pegged, all scored 5/100)

**What happens:** The algorithm declares these tokens as honeypots ("Cannot sell tokens") when they are legitimate Binance bridge tokens worth billions in market cap.

**Root cause hypothesis:** The honeypot sell simulation fails when encountering proxy/upgradeable contract patterns. The simulation likely:
1. Deploys a test transaction against the implementation contract
2. The proxy redirects and the simulation doesn't follow correctly
3. Simulation failure → interpreted as "can't sell" → honeypot flag

**Why some pass and others don't:** WBNB, BUSD, USDT, USDC, ETH, BTCB use simpler contract patterns (non-proxy or recognized proxy). XRP, LINK, DOGE, TWT use older or different proxy implementations that the simulation can't handle.

**Fix:** 
- Don't rely solely on sell simulation for honeypot detection
- If simulation fails on a proxy contract, mark as "inconclusive" not "honeypot"
- Whitelist Binance bridge deployer addresses (0x...TokenHub, etc.)
- Cross-reference with CoinGecko/CMC for known tokens

**Impact:** This is the #1 issue. Telling users that XRP and LINK are honeypots destroys credibility.

---

## Issue #2: HIGH — "Impersonation" Flag on Real Tokens

**Affected tokens:** LINK ("Impersonating ChainLink"), TWT ("Impersonation of official Trust Wallet Token"), TRX ("Fake Token: not the official TRON BEP20")

**What happens:** The algorithm flags official Binance-pegged tokens as impersonations/fakes.

**Root cause:** The LLM analysis sees a token named "ChainLink" on BSC that has concerning contract patterns (from Issue #1) and concludes it must be a fake. There's no mechanism to verify this IS the official Binance-pegged version.

**Fix:**
- Maintain a registry of official Binance-pegged token addresses
- Check token deployment against known Binance bridge infrastructure
- If token address matches CoinGecko/CMC listing for that chain, don't flag as impersonation

---

## Issue #3: MEDIUM — FLOKI Tax Detection is Wrong

**Token:** FLOKI (0xfb5B838b6cfEEdC2873aB27866079AC55363D37E)  
**Reported:** 59% round-trip tax → scored 15/100 on Trading  
**Actual:** FLOKI has approximately 3% buy / 3% sell tax

**Root cause:** The tax simulation likely misinterprets FLOKI's reflection/redistribution mechanism as a tax. The contract's `_getValues` and fee distribution to holders creates an apparent loss during simulation that isn't an actual tax.

**Fix:** Differentiate between actual taxes (sent to specific wallets) vs. reflection mechanisms (redistributed to holders).

---

## Issue #4: MEDIUM — Low Liquidity Penalizes Cross-Chain Tokens

**Affected:** BAKE ($1,553), MATIC ($2,815), ATOM ($7,302), LINA ($3,138)

**What happens:** Legitimate tokens that primarily trade on other chains/CEXs get hammered for low BSC DEX liquidity.

**Problem:** BAKE is listed on Binance CEX with millions in volume. Low PancakeSwap liquidity doesn't make it a scam.

**Fix:** 
- Add CoinGecko/CMC market data as context
- If a token has significant CEX volume but low DEX liquidity, adjust the liquidity penalty
- Note: "Low DEX liquidity" is a valid warning but shouldn't make a token score 38/100

---

## Issue #5: LOW — Unverified Contracts Return Empty Response

**Affected:** SquidGame, SaveTheKids, MeerkatFinance, TurtleDEX, CompounderFinance, StableMagnet, HIGH, SANTOS, LAZIO

**What happens:** API returns no data lines — the SSE stream has no complete result.

**Problem:** Users get no feedback at all. Should return a result like: "Contract is not verified on BscScan — this is itself a major red flag. Score: 5/100"

**Fix:** Handle unverified contracts explicitly. An unverified contract should auto-score very low with a clear explanation.

---

## Issue #6: LOW — AUCTION Address Returns Wrong Token

**Address tested:** 0xc12eCeE46ed65D970EE5C899FCC7AE133AfF9b03  
**Expected:** Bounce Token (AUCTION)  
**Returned:** TRYfinance (TRY) — scored 5/100

**What happened:** The address may be wrong, or the token at that address has changed/been hijacked. The algorithm correctly identified this specific token as problematic, but the address mapping was wrong from our test input.

**Action:** Not an algorithm issue — our test used a bad address. But it highlights that address verification is important.

---

## Issue #7: LOW — Score Binarity (5 vs 90+)

**Pattern:** Tokens tend to cluster at either 5/100 or 85-100/100 with less nuance in between.

**Problem:** A token with some concerning features (proxy, mint function) but clear legitimacy (millions in liquidity, Binance deployer) shouldn't score 5. Scores of 5 should be reserved for actual honeypots with zero redemption qualities.

**Fix:** 
- Implement score floors: If liquidity > $100K AND holders > 10K AND CoinGecko listed → minimum score 30
- Make the 5/100 score require multiple confirmed critical flags, not just simulation failure
- Add intermediate categories: "Proxy contract detected, exercise caution" → 40-50, not 5

---

## Summary Priority

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | Honeypot false positive on proxy tokens | 7 blue chips misclassified |
| P0 | Impersonation flag on real tokens | 3 tokens called "fake" |
| P1 | FLOKI tax detection wrong | Tax calculation unreliable |
| P1 | Low liquidity over-penalizes cross-chain tokens | 4+ tokens affected |
| P2 | Empty response for unverified contracts | 9 tokens with no result |
| P2 | Score binarity | Overall calibration issue |
