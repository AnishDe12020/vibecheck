# 🔍 VibeCheck — AI Token Safety Scanner

**Paste any BSC token address → get an instant AI-powered safety analysis → on-chain attestation on opBNB.**

Built for the [Good Vibes Only: OpenClaw Edition](https://dorahacks.io/hackathon/goodvibes) hackathon.

## What it does

VibeCheck helps users evaluate the safety of any BEP-20 token on BNB Smart Chain before investing. It combines on-chain data analysis with AI to provide a clear, actionable safety report.

### How it works

1. **Paste a token address** — any BSC BEP-20 contract
2. **On-chain data fetching** — contract source code, top holders, PancakeSwap liquidity, recent large transfers
3. **AI safety analysis** — Kimi K2.5 analyzes the data and produces a structured safety report
4. **Safety score 0-100** with risk level (SAFE / CAUTION / DANGER / CRITICAL)
5. **On-chain attestation** — the verdict is permanently recorded on opBNB as an attestation

### Risk categories

| Category | What it checks |
|---|---|
| 📜 Contract Safety | Verified source, owner functions, mint/pause, honeypot patterns |
| 🏦 Holder Concentration | Top holder %, whale risk, burned supply |
| 💧 Liquidity Health | PancakeSwap depth, lock status, USD value |
| 📊 Trading Patterns | Large transfers, suspicious activity, wash trading |

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4
- **AI:** Kimi K2.5 via OpenRouter
- **On-chain data:** BSCScan API + ethers.js (direct RPC calls to BSC)
- **Attestation:** Custom Solidity contract on opBNB
- **Liquidity:** PancakeSwap V2 factory/pair contracts

## Project Structure

```
vibecheck/
├── contracts/
│   └── VibeCheck.sol          # On-chain attestation contract (opBNB)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Main UI — input, score gauge, report
│       │   └── api/scan/
│       │       └── route.ts    # API — fetch data → analyze → attest
│       └── lib/
│           ├── analyzer.ts     # AI analysis pipeline (Kimi K2.5)
│           ├── attester.ts     # opBNB attestation submission
│           ├── fetcher.ts      # BSC data fetching (holders, liquidity, transfers)
│           ├── chain.ts        # ABIs, addresses, provider config
│           └── types.ts        # TypeScript interfaces
├── scripts/
│   └── deploy.js              # Contract deployment script
└── README.md
```

## Setup

```bash
# Clone
git clone https://github.com/AnishDe12020/vibecheck
cd vibecheck

# Install frontend deps
cd frontend && npm install

# Configure
cp .env.local.example .env.local
# Fill in:
#   BSCSCAN_API_KEY=       (from bscscan.com)
#   OPENROUTER_API_KEY=    (from openrouter.ai)
#   DEPLOYER_PRIVATE_KEY=  (for attestations)
#   VIBECHECK_CONTRACT_ADDRESS= (after deployment)

# Run
npm run dev
```

Open http://localhost:3000, paste a BSC token address, hit Scan.

## Contract Deployment

```bash
cd ..  # back to root
node scripts/deploy.js testnet   # or 'mainnet'
```

Requires opBNB gas in the deployer wallet.

## AI Build Log

This project was built using AI-assisted development (Claude via OpenClaw). Key AI contributions:
- Smart contract design and implementation
- Data fetching pipeline architecture
- AI analysis prompt engineering
- Frontend UI/UX design and implementation
- Deployment scripting

## Track

**Consumer** — Mass-friendly safety tool that anyone can use to check a token in under a minute.

## License

MIT
