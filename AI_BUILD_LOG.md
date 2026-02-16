# AI Build Log — VibeCheck

This project was built using AI-assisted vibe coding with **Claude** (via OpenClaw) as the primary development partner.

## Timeline

**Total build time: ~3 hours** (Feb 16, 2026)

### Phase 1: Architecture & Smart Contract (30 min)
- **Human:** Defined the project idea — BSC token safety scanner with on-chain attestations
- **AI:** Designed the smart contract (`VibeCheck.sol`), chose opBNB for cheap attestation storage
- **AI:** Set up the data pipeline architecture — what on-chain data to fetch and how to analyze it

### Phase 2: Backend Data Layer (45 min)  
- **AI:** Built the BSC data fetching layer (`fetcher.ts`):
  - Token info via ethers.js + BSCScan API
  - Top holder distribution analysis
  - PancakeSwap V2 liquidity depth checking (WBNB, BUSD, USDT pairs)
  - Recent large transfer detection
- **AI:** Wrote the AI analysis prompt — structured to produce consistent JSON output with specific scoring criteria
- **AI:** Built the OpenRouter integration for Kimi K2.5

### Phase 3: Frontend UI (1 hour)
- **AI:** Designed and implemented the full frontend:
  - Dark theme with web3 aesthetic
  - Circular score gauge with animated ring
  - Real-time SSE streaming for scan progress
  - Risk category cards with color-coded findings
  - Recent scans (localStorage)
  - Example token quick-scan buttons
  - Share to X button
- **Human:** Provided API keys, reviewed design direction

### Phase 4: Deployment & Integration (45 min)
- **AI:** Generated deployer wallet, bridged BNB to opBNB (programmatic bridge via L1StandardBridge)
- **AI:** Compiled and deployed contract to opBNB mainnet
- **AI:** Verified contract on opBNB BSCScan via API
- **AI:** Set up Vercel deployment with env vars
- **AI:** Wired up end-to-end: scan → AI analysis → on-chain attestation
- **Human:** Funded wallet, bridged tokens

### Phase 5: Testing & Polish (30 min)
- **AI:** Tested with 3 tokens: WBNB (safe), CAKE (caution), SafeMoon (critical)
- **AI:** Added scan history page, OG images, shareable URLs
- **AI:** Built GitHub repo, wrote README

## AI Tools Used
- **Claude Opus 4** (via OpenClaw) — primary coding, architecture, deployment
- **Kimi K2.5** (via OpenRouter) — runtime token safety analysis
- **No Cursor/Copilot** — all code written through conversational AI

## What AI Did Well
- Smart contract design was solid on first attempt
- Data fetching pipeline correctly handled BSC-specific patterns (PancakeSwap V2, BSCScan API quirks)
- UI/UX design was polished without iteration
- Programmatic contract deployment + verification saved significant time

## What Needed Human Input
- API key management and wallet funding
- Deployment protection configuration (Vercel)
- Strategic decisions (which track, what to prioritize)
- BSC ecosystem knowledge (which tokens to test, what matters to judges)

## Lines of Code
- **Smart Contract:** ~90 lines Solidity
- **Frontend:** ~500 lines TypeScript/React
- **Backend:** ~400 lines TypeScript (fetcher + analyzer + attester)
- **Total:** ~1,000 lines of meaningful code
