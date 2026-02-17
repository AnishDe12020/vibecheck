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

## 2026-02-16: Final Polish & Features (The "$1k UI" Grind)
- Switched to **Gemini 3.0 Flash Preview** for faster and more accurate reasoning.
- Implemented **Comparison Mode** (`/compare`) allowing users to battle two tokens.
- Redesigned **History page** to match the premium glass morphism style.
- Added **Token Logos** powered by Trust Wallet CDN.
- Built **Holder Distribution charts** and **Liquidity Depth panels**.
- Added **Animated Mesh Background** and premium SVG effects to the score gauge.
- Optimized for mobile and added "Copy Link" / "Share on X" buttons.

## 2026-02-17: Multi-Agent Parallel Development Sprint

This session showcased **parallel AI sub-agents** working on different aspects simultaneously — 5+ agents running concurrently.

### Mobile Responsiveness Overhaul (Agent 1)
- **AI:** Full audit of all pages for mobile viewports (320px-428px)
- **AI:** Fixed horizontal overflow caused by hero glow pseudo-element (600px wide)
- **AI:** Added `overflow-x: hidden` on html/body
- **AI:** Made search bar stack vertically on mobile (`flex-col sm:flex-row`)
- **AI:** Responsive typography scaling across all pages
- **AI:** Fixed progress bar centering and spacing on mobile
- **AI:** Added responsive padding (`px-4 sm:px-6 md:p-8` pattern)
- **AI:** Accessibility improvements: aria-labels, focus-visible styles, semantic roles

### Component Extraction & Code Quality (Agent 2)
- **AI:** Extracted duplicated components into shared files:
  - `ScoreGauge.tsx`, `ScanProgressBar.tsx`, `CategoryCard.tsx`, `SkeletonReport.tsx`
  - `lib/constants.ts` for shared constants (RISK_COLORS, RISK_BG, etc.)
- **AI:** Updated all page files to import from shared locations
- **AI:** Eliminated ~400 lines of duplicated code

### Compare & History Page Improvements (Agent 3)
- **AI:** Built `ComparisonSummary` component — side-by-side category score bars with winner highlighting
- **AI:** Added search input and risk level filter buttons to History page
- **AI:** Shows filtered count ("X of Y scans")
- **Human:** Reviewed and approved direction

### Algorithm Testing & Validation (Agent 4)
- **AI:** Systematically tested 50+ tokens across categories:
  - Blue chips (WBNB, CAKE, USDT, BTCB, etc.)
  - DeFi tokens (XVS, ALPACA, TWT, etc.)
  - Memecoins (DOGE, SHIB, FLOKI, BABYDOGE)
  - Known scams (Squid Game, old SafeMoon, Save the Kids, etc.)
  - Bridge/wrapped tokens (axlUSDC, BETH)
  - Dead/abandoned projects
- **AI:** Documented accuracy rates, false positives/negatives
- **AI:** Identified edge cases (bridge tokens with low liquidity scoring too harshly)

### Loading Animation Enhancement (Agent 5)
- **AI:** Designed and implemented enhanced scan animation
- **AI:** Pulsing radar/shield visual during scanning
- **AI:** Step-by-step transition animations with satisfying checkmarks
- **AI:** Score count-up animation on completion
- **AI:** All CSS-based for performance

### Deployment Pipeline Fix
- **AI:** Discovered Vercel alias mismatch — deploys were going to wrong domain
- **AI:** Fixed by manually aliasing each deploy to `vibecheck-bsc.vercel.app`
- **Human:** Tested on actual mobile device, provided screenshots for feedback

### AI Coordination
- **5 sub-agents** ran in parallel via OpenClaw's session spawning
- Each agent was given a focused task with clear boundaries
- Agents independently built, tested, and reported back
- Main agent (Claude Opus 4) coordinated merging and deployment
- **Human:** Directed priorities, tested on device, provided real-world feedback

---

## Sprint 3: Final Polish (Feb 17, 2026) — Evening Session

### Hero Redesign
- **AI:** Redesigned home page hero with split layout (text left, preview card right)
- **AI:** Added floating product preview card with score gauge, liquidity/holder stats
- **AI:** Added "Live on BNB Chain" badge, bigger typography
- **AI:** Added "Powered By" trust bar with branded icons (Gemini AI, opBNB, PancakeSwap, BSCScan, Honeypot.is)
- **AI:** Added token symbol marquee with logos (scrolling ticker, clickable)
- **AI:** Added subtle emerald gradient background

### Branding
- **Human:** Designed logo (magnifying glass + shield + checkmark)
- **AI:** Converted to all formats: favicon (ICO, 16px, 32px PNG), apple-touch-icon (180px), android-chrome (192px, 512px)
- **AI:** Updated header navbar to use logo image
- **Human:** Purchased opvibecheck.xyz domain

### Critical Bug Fixes
- **AI:** Fixed attestation API — contract address env var had trailing newline breaking ethers calls
- **AI:** Fixed portfolio SSE parsing — was checking wrong event fields (evt.type→evt.status, evt.report→evt.data)
- **AI:** Switched portfolio API from BSCScan tokentx (blocked on free tier) to direct RPC balance checks for 20 popular tokens
- **AI:** Fixed ScoreGauge text scaling — font was fixed at text-5xl regardless of component size

### Performance: Redis Caching
- **AI:** Integrated Upstash Redis for scan result caching (1hr TTL)
- **AI:** Repeat scans now return instantly from cache
- **AI:** Graceful fallback to in-memory cache if Redis unavailable
- **Human:** Configured Upstash Redis on Vercel (256MB)

### DoraHacks Submission
- **Human:** Filled out BUIDL submission form (Consumer track, Crypto/Web3 category)
- **AI:** Wrote comprehensive project description covering problem, solution, tech stack, algorithm validation, BNB Chain integration
- **AI:** Advised on track selection, team info, infrastructure tags
- **Human + Sandeep:** Community upvote campaign (6 votes initial)

### Competition Analysis
- **AI:** Scraped and analyzed 39+ competing projects on DoraHacks
- **AI:** Identified BNBrain (36K LOC, 32 tools) and ShieldBot (Chrome extension, 6 data sources) as top competitors
- **AI:** Assessed VibeCheck as competitive for top 10 ($10K each) — strong on UX, on-chain attestation, and accessibility

---

## Sprint 4: Production Polish & Portfolio Scanner (Feb 17, 2026 — Late Session)

### Portfolio Scanner Fix & Enhancement
- **AI:** Fixed RPC rate limiting — BSC public RPC returns `-32005` when 20+ parallel `eth_call` requests hit. Changed to batch 4 at a time.
- **AI:** Fixed SSE parser bug in portfolio page — was splitting on `\n` instead of `\n\n` (SSE double-newline delimiter), causing all scores to silently fail
- **AI:** Added parallel scan execution (3 concurrent) — ~3x faster than sequential
- **AI:** Fixed double `controller.close()` crash — cached responses closed the SSE stream, then `finally` block tried again
- **AI:** Added loading skeleton (6 pulsing cards) while portfolio fetches
- **AI:** Added live progress counter ("Scanned 5 of 21 tokens..." → "✅ Scanned 21 tokens")
- **AI:** Fixed example wallet address (was invalid/truncated)

### UI Polish
- **AI:** Moved flags section to top of scan results (below score card) with color-coded borders (green/yellow/red)
- **AI:** Hid "OUT OF 100" label on small gauges (portfolio cards) — too cramped at 90px
- **AI:** Reduced glow intensity on small score gauges

### Page Consolidation
- **AI:** Merged History + Proofs into single page — eliminates confusing redundancy
- **AI:** History page now includes "On-Chain Attested" badge, "View Contract ↗" link, attestation stats
- **AI:** Each scan row shows "✓ Attested" badge
- **AI:** Nav simplified from 5 items to 4 (Scan, Compare, Portfolio, History)
- **AI:** `/attestations` redirects to `/history`

### Caching
- **AI:** Connected Upstash Redis to dev server (pulled env vars from Vercel production)
- **AI:** Cached scans now load instantly on both dev and production
- **AI:** In-memory fallback still works when Redis unavailable

### Browser Testing
- **AI:** Full automated browser test of all pages (home, scan, compare, portfolio, history, 404)
- **AI:** Tested both desktop (1280px) and mobile (390px) viewports
- **AI:** Verified portfolio scanner end-to-end: 21 tokens found, all scored correctly

### Deployment
- **AI:** Deployed to Vercel production, aliased to vibecheck-bsc.vercel.app
- **AI:** opvibecheck.xyz domain live with SSL
- **Human:** Fixed DNS records at registrar

### Key Bug Fixes Summary
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Portfolio "No data" on all cards | SSE split on `\n` not `\n\n` | Proper SSE double-newline parsing |
| Portfolio only finding BNB | RPC rate limit (`-32005`) | Batch 4 calls at a time |
| Cached scans crashing (500) | Double `controller.close()` | try/catch in finally block |
| Portfolio example "Invalid address" | Truncated address string | Real Binance hot wallet |
| `vercel env pull` destroyed API keys | Overwrote entire .env.local | Manual restore |

---

## Sprint 5: Deep Audit & Final Polish (Feb 17, 2026)

**Duration:** ~2 hours  
**AI model:** Claude Opus 4.5 via OpenClaw  
**Method:** Autonomous browser-driven testing on local dev server (localhost:3333)

### Bug Fixes
- **AI:** Fixed address checksum bug — `ethers.isAddress()` in v6 rejects mixed-case addresses; now normalizes to `.toLowerCase()` before validation across all API routes
- **AI:** Fixed error message display — scan page showed raw JSON `{"error":"Invalid token address"}` instead of clean text
- **AI:** Fixed domain references — replaced `vibecheck-bsc.vercel.app` with `opvibecheck.xyz` across share cards, OG images, metadata

### New Features
- **AI:** **Danger/Critical warning banner** — prominent color-coded alert at top of scan results for risky tokens (orange for DANGER, red for CRITICAL)
- **AI:** **Token names in history** — history API now enriches results with cached token names/symbols; search works by name
- **AI:** **History deduplication** — shows only latest scan per token, eliminating confusing duplicates
- **AI:** **Dynamic page titles** — browser tab shows "CAKE 98/100 — SAFE | VibeCheck" during scans
- **AI:** **Portfolio Scanner CTA** on homepage — expanded stats badge with direct link to portfolio scanner
- **AI:** **"Manual DYOR vs VibeCheck" comparison section** — side-by-side value prop on homepage
- **AI:** **Portfolio link on History page** — bridges gap between individual scans and bulk scanning
- **AI:** **How-it-works always visible** — no longer hidden when recent scans exist
- **AI:** **PWA manifest + robots.txt** — production-ready metadata

### Testing Methodology
- **AI:** Automated browser testing via headless Chrome (OpenClaw sandbox browser)
- **AI:** Tested all pages at desktop (1280px) and mobile (390px) viewports
- **AI:** Console error monitoring — verified no runtime errors
- **AI:** Cache warming — pre-warmed popular tokens for snappy demo performance

### Bug Fixes Summary (Sprint 5)
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Mixed-case addresses fail scan | `ethers.isAddress()` strict checksum | Normalize to `.toLowerCase()` |
| Raw JSON in error messages | Rendering full response body | Extract `.error` field from JSON |
| Duplicate history entries | Multiple attestations per token | Deduplicate, keep latest timestamp |
| "How it works" hidden | Conditional on 0 recent scans | Always show in idle state |
