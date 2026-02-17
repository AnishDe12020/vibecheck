#!/bin/bash
# VibeCheck Token Scanner - Systematic Test

API="https://vibecheck-bsc.vercel.app/api/scan-stream?address="
RESULTS="/home/anish/vibecheck/test_raw_results.jsonl"
> "$RESULTS"

scan_token() {
    local name="$1"
    local addr="$2"
    local expected="$3"
    echo "Testing: $name ($addr)..."
    
    result=$(curl -s --max-time 30 "${API}${addr}" | grep "^data:" | tail -1 | sed 's/^data: //')
    
    if [ -z "$result" ]; then
        echo "{\"input_name\":\"$name\",\"address\":\"$addr\",\"expected\":\"$expected\",\"error\":\"no_response\"}" >> "$RESULTS"
        echo "  -> NO RESPONSE"
    else
        # Extract key fields with python
        echo "$result" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    if 'data' in d:
        r=d['data']
        token_name=r['token']['name']
        symbol=r['token']['symbol']
        score=r['overallScore']
        risk=r['riskLevel']
        cats={k:{'score':v['score'],'level':v['level']} for k,v in r['categories'].items()}
        flags=r.get('flags',[])[:5]
        print(f'  -> {token_name} ({symbol}): {score}/100 [{risk}]')
        print(f'     Categories: {cats}')
        print(f'     Flags: {flags[:3]}')
        out={'input_name':'$name','address':'$addr','expected':'$expected','token_name':token_name,'symbol':symbol,'score':score,'risk':risk,'categories':cats,'flags':flags}
        with open('$RESULTS','a') as f:
            f.write(json.dumps(out)+'\n')
    else:
        print(f'  -> Error: {d}')
        out={'input_name':'$name','address':'$addr','expected':'$expected','error':str(d)}
        with open('$RESULTS','a') as f:
            f.write(json.dumps(out)+'\n')
except Exception as e:
    print(f'  -> Parse error: {e}')
    out={'input_name':'$name','address':'$addr','expected':'$expected','error':str(e)}
    with open('$RESULTS','a') as f:
        f.write(json.dumps(out)+'\n')
" 2>&1
    fi
    sleep 2
}

echo "=== BATCH 1: Blue Chips (expect 70+) ==="
scan_token "WBNB" "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" "70+"
scan_token "CAKE" "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" "70+"
scan_token "BUSD" "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" "70+"
scan_token "USDT" "0x55d398326f99059fF775485246999027B3197955" "70+"
scan_token "USDC" "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" "70+"
scan_token "ETH_BSC" "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" "70+"
scan_token "BTCB" "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" "70+"
scan_token "XRP_BSC" "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE" "70+"
scan_token "DOT_BSC" "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402" "70+"
scan_token "LINK_BSC" "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD" "70+"

echo ""
echo "=== BATCH 2: DeFi Tokens (expect 60-85) ==="
scan_token "XVS" "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63" "60-85"
scan_token "ALPACA" "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F" "60-85"
scan_token "BAKE" "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5" "60-85"
scan_token "TWT" "0x4B0F1812e5Df2A09796481Ff14017e6005508003" "60-85"
scan_token "BABY" "0x53E562b9B7E5E94b81f10e96Ee70Ad06df3D2657" "60-85"

echo ""
echo "=== BATCH 3: Memecoins (variable) ==="
scan_token "DOGE_BSC" "0xbA2aE424d960c26247Dd6c32edC70B295c744C43" "30-70"
scan_token "SHIB_BSC" "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D" "30-70"
scan_token "FLOKI" "0xfb5B838b6cfEEdC2873aB27866079AC55363D37E" "30-70"
scan_token "BABYDOGE" "0xc748673057861a797275CD8A068AbB95A902e8de" "30-70"
scan_token "SAFEMOON_V2" "0x42981d0bfbAf196529376EE702F2a9Eb9092fcB5" "30-70"

echo ""
echo "=== BATCH 4: Known Scams (expect <30) ==="
scan_token "SquidGame" "0x87230146E138d3D296a9a77e497A2A83012e9Bc5" "<30"
scan_token "SafeMoon_OLD" "0x8076C74C5e3F5852037F31Ff0093Eeb8c8ADd8D3" "<30"
scan_token "SaveTheKids" "0x4Ee80cC6d7DF55B1b4bDa19e845a6e1a8fAf65ea" "<30"
scan_token "MeerkatFinance" "0xcF50e57E86bD4bDe43E2b70a2fCA84f4013B66cf" "<30"
scan_token "TurtleDEX" "0xf15Bbd5fEabb9A72782576E98e54A0EE6F1FC4F8" "<30"
scan_token "CompounderFinance" "0xEf68e7C694F40c8202821eDF525dE3782458639f" "<30"
scan_token "StableMagnet" "0x2bA6204c23fBd5698ED90ABC911de263E5f41266" "<30"
scan_token "Honeypot_Example" "0x11111111a9345bc43eb4C3738EA25f4b401EcE5C" "<30"

echo ""
echo "=== BATCH 5: Bridge/Wrapped ==="
scan_token "axlUSDC" "0x4268B8F0B87b6Eae5d897996E6b845ddbD99Adf3" "50-80"
scan_token "anyUSDC" "0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2" "30-60"
scan_token "BETH" "0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B" "60-80"

echo ""
echo "=== BATCH 6: Mid/Small Caps ==="
scan_token "RACA" "0x12BB890508c125661E03b09EC06E404bc9289040" "40-70"
scan_token "HIGH" "0x10Fec93d01e5DFb5162cd9dBCEaEB5E7402A5879" "40-70"
scan_token "SANTOS" "0xA64455a4553C9034236734FadDAddbb64aCE4F7B" "40-70"
scan_token "LAZIO" "0x77d547256A2cD95F32F3bE6AAC1A35c2bF3A6Fd8" "40-70"

echo ""
echo "=== BATCH 7: Exploited/Dead Projects ==="
scan_token "BUNNY_PancakeBunny" "0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51" "<40"
scan_token "IDIA_Impossible" "0x0b15Ddf19D47E6a86A56148fb4aFFFc6929BcB89" "40-60"
scan_token "EPS_Ellipsis" "0xa7f552078dcc247c2684336020c03648500c6d9f" "30-50"
scan_token "BELT_Finance" "0xe0e514c71282b6f4e823703a39374cf58dc3ea4f" "30-50"

echo ""
echo "=== BATCH 8: Additional known tokens ==="
scan_token "SFP_SafePal" "0xD41FDb03Ba84762dD66a0af1a6C8540FF1ba5dfb" "50-75"
scan_token "C98_Coin98" "0xaEC945e04baF28b135Fa7c640f624f8D90F1C3a6" "50-75"
scan_token "MBOX_Mobox" "0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377" "40-65"
scan_token "WIN_WINk" "0xaeF0d72a118ce24feE3cD1d43d383897D05B4e99" "30-60"
scan_token "TRX_BSC" "0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3" "50-75"
scan_token "ADA_BSC" "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47" "60-80"
scan_token "MATIC_BSC" "0xCC42724C6683B7E57334c4E856f4c9965ED682bD" "60-80"
scan_token "AVAX_BSC" "0x1CE0c2827e2eF14D5C4f29a091d735A204794041" "60-80"
scan_token "FIL_BSC" "0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153" "50-75"
scan_token "ATOM_BSC" "0x0Eb3a705fc54725037CC9e008bDede697f62F335" "60-80"
scan_token "LTC_BSC" "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94" "60-80"
scan_token "DODO" "0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2" "40-65"
scan_token "LINA_Linear" "0x762539b45A1dCcE3D36d080F74d1AED37844b878" "30-55"
scan_token "AUCTION_BSC" "0xc12eCeE46ed65D970EE5C899FCC7AE133AfF9b03" "40-65"

echo ""
echo "=== DONE ==="
echo "Results saved to $RESULTS"
