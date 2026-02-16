# 🔍 VibeCheck — AI Token Safety Scanner

**Paste any BSC token address → get an instant AI-powered safety analysis → on-chain attestation on opBNB.**

🌐 **Live Demo:** [vibecheck-bsc.vercel.app](https://vibecheck-bsc.vercel.app)  
📜 **Contract:** [0x427F...AA161 on opBNB](https://opbnb.bscscan.com/address/0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161) (v2, with access control)  
🏗️ **Track:** Consumer  
🎯 **Hackathon:** [Good Vibes Only: OpenClaw Edition](https://dorahacks.io/hackathon/goodvibes)

## What it does

VibeCheck helps users evaluate the safety of any BEP-20 token on BNB Smart Chain before investing. It combines on-chain data analysis with AI to provide a clear, actionable safety report.

### How it works

1. **Paste a token address** — any BSC BEP-20 contract
2. **On-chain data fetching** — contract source code, top holders, PancakeSwap liquidity, recent large transfers
3. **AI safety analysis** — Kimi K2.5 analyzes the data and produces a structured safety report
4. **Safety score 0-100** with risk level (SAFE / CAUTION / DANGER / CRITICAL)
5. **On-chain attestation** — the verdict is permanently recorded on opBNB

### Risk categories

| Category | What it checks |
|---|---|
| 📜 Contract Safety | Verified source, owner functions, mint/pause, honeypot patterns |
| 🏦 Holder Concentration | Top holder %, whale risk, burned supply |
| 💧 Liquidity Health | PancakeSwap depth, lock status, USD value |
| 📊 Trading Patterns | Large transfers, suspicious activity, wash trading |

### Example Results

| Token | Score | Risk Level |
|---|---|---|
| WBNB | 88/100 | ✅ SAFE |
| CAKE | 72/100 | ⚠️ CAUTION |
| SafeMoon | 12/100 | 🚨 CRITICAL |

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4
- **AI:** Kimi K2.5 via OpenRouter
- **On-chain data:** BSCScan API + ethers.js (direct RPC calls to BSC)
- **Attestation:** Custom Solidity contract on opBNB (verified)
- **Liquidity:** PancakeSwap V2 factory/pair contracts
- **Streaming:** Server-Sent Events for real-time scan progress

## Architecture

```
User → Next.js Frontend
         ↓
    API Route (POST /api/scan-stream)
         ↓
    ┌────────────────────────────┐
    │ 1. Fetch BSC Data          │
    │    • BSCScan API           │
    │    • Direct RPC (ethers)   │
    │    • PancakeSwap V2        │
    ├────────────────────────────┤
    │ 2. AI Analysis             │
    │    • Kimi K2.5 via         │
    │      OpenRouter            │
    │    • Structured JSON       │
    │      output                │
    ├────────────────────────────┤
    │ 3. On-chain Attestation    │
    │    • VibeCheck.sol on      │
    │      opBNB                 │
    │    • Permanent record      │
    └────────────────────────────┘
         ↓
    SSE Stream → Frontend
    (real-time progress updates)
```

## Project Structure

```
vibecheck/
├── contracts/
│   └── VibeCheck.sol          # On-chain attestation contract (opBNB)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Main UI — input, score gauge, report
│       │   ├── history/        # On-chain scan history
│       │   └── api/
│       │       ├── scan/       # Original scan endpoint
│       │       ├── scan-stream/# SSE streaming scan
│       │       ├── total-scans/# Contract scan counter
│       │       └── history/    # On-chain history data
│       └── lib/
│           ├── analyzer.ts     # AI analysis pipeline (Kimi K2.5)
│           ├── attester.ts     # opBNB attestation submission
│           ├── fetcher.ts      # BSC data fetching
│           ├── chain.ts        # ABIs, addresses, providers
│           └── types.ts        # TypeScript interfaces
├── scripts/
│   └── deploy.js              # Contract deployment script
├── AI_BUILD_LOG.md            # Detailed AI build log
└── README.md
```

## Setup

```bash
# Clone
git clone https://github.com/AnishDe12020/vibecheck
cd vibecheck/frontend

# Install
npm install

# Configure
cp .env.local.example .env.local
# Fill in your keys (see .env.local.example)

# Run
npm run dev
```

Open http://localhost:3000, paste a BSC token address, hit Scan.

## Contract Deployment

```bash
cd vibecheck
node scripts/deploy.js mainnet   # or 'testnet'
```

Requires opBNB gas in the deployer wallet. Current deployment cost: ~$0.003.

## On-chain Proof

- **Contract v2:** [`0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161`](https://opbnb.bscscan.com/address/0x427F80AE3ebF7C275B138Bc9C9A39C76572AA161)
- **Contract v1 (deprecated):** [`0x851d1B08F9166D18eC379B990D7E9D6d45FFA8CA`](https://opbnb.bscscan.com/address/0x851d1B08F9166D18eC379B990D7E9D6d45FFA8CA#code)
- **Network:** opBNB Mainnet (Chain ID 204)
- **v2 changes:** Added access control (only authorized scanners can submit attestations)
- **Sample attestations (v1):**
  - [WBNB scan](https://opbnb.bscscan.com/tx/0x647dbce8b461bf83ee6a2773b997c38f9f9a3611453026d1800ec4f6180761a2)
  - [CAKE scan](https://opbnb.bscscan.com/tx/0x61b4772a3295e90931f6dbc3e76b2ed99c4181a5e39a293cc24aa9164752984f)
  - [SafeMoon scan](https://opbnb.bscscan.com/tx/0x8757889b1a88c9d89e809ad311a50a4ffdeb6da8bac8a003f379940b96e49b4c)

## Security

### API Rate Limiting
- IP-based rate limiting: 5 scans per IP per hour
- In-memory store (best-effort in serverless; for production, use Upstash Redis)
- Applied to `/api/scan` and `/api/scan-stream`

### Contract Access Control (v2)
- `onlyAuthorized` modifier on `submitAttestation` — only whitelisted scanner addresses can write
- Owner can `addScanner(address)` / `removeScanner(address)`
- Deployer is auto-authorized in constructor

### Request Validation
- Content-Type enforcement (must be `application/json`)
- Max body size (1KB)
- Input address validation via ethers.js

### CORS
- Restricted to `vibecheck-bsc.vercel.app` and `localhost` origins

### Error Sanitization
- Stack traces and file paths are stripped from client-facing errors

### Production Improvements (not yet implemented)
- **Cloudflare WAF** — custom domain + Cloudflare proxy for DDoS protection and bot filtering
- **Upstash Redis rate limiter** — persistent, serverless-friendly rate limiting across all instances
- **Contract verification** — verify v2 contract source on opBNB BSCScan

## AI Build Log

See [AI_BUILD_LOG.md](./AI_BUILD_LOG.md) for a detailed breakdown of how AI was used throughout development.

**TL;DR:** Built in ~3 hours with Claude (via OpenClaw) handling architecture, coding, deployment, and testing. Kimi K2.5 powers the runtime token analysis. ~1,000 lines of meaningful code.

## License

MIT
