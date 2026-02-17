#!/bin/bash
# Pre-warm Redis cache by scanning popular BSC tokens

TOKENS=(
  "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82:CAKE"
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c:WBNB"
  "0x55d398326f99059fF775485246999027B3197955:USDT"
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d:USDC"
  "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c:BTCB"
  "0x2170Ed0880ac9A755fd29B2688956BD959F933F8:ETH"
  "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE:XRP"
  "0xbA2aE424d960c26247Dd6c32edC70B295c744C43:DOGE"
  "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D:SHIB"
  "0xfb5B838b6cfEEdC2873aB27866079AC55363D37E:FLOKI"
  "0xc748673057861a797275CD8A068AbB95A902e8de:BabyDoge"
  "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63:XVS"
  "0x4B0F1812e5Df2A09796481Ff14017e6005508003:TWT"
  "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F:ALPACA"
)

echo "🔥 Pre-warming VibeCheck cache for ${#TOKENS[@]} tokens..."

for entry in "${TOKENS[@]}"; do
  addr="${entry%%:*}"
  name="${entry##*:}"
  echo -n "  Scanning $name ($addr)... "
  curl -s "https://vibecheck-bsc.vercel.app/api/scan-stream?address=$addr" > /dev/null
  echo "✅"
done

echo "🎉 Cache warm-up complete!"
