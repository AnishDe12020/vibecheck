import { ethers } from "ethers";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import "dotenv/config";

// Compile with solc
console.log("Compiling VibeCheck.sol...");
const solcOutput = execSync(
  `npx solcjs --optimize --bin --abi --base-path . contracts/VibeCheck.sol -o build/`,
  { encoding: "utf-8" }
);
console.log("Compiled.");

// Read artifacts
const bin = readFileSync("build/contracts_VibeCheck_sol_VibeCheck.bin", "utf-8");
const abi = JSON.parse(readFileSync("build/contracts_VibeCheck_sol_VibeCheck.abi", "utf-8"));

const NETWORK = process.argv[2] || "testnet";
const RPC = NETWORK === "mainnet"
  ? "https://opbnb-mainnet-rpc.bnbchain.org"
  : "https://opbnb-testnet-rpc.bnbchain.org";
const CHAIN_ID = NETWORK === "mainnet" ? 204 : 5611;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log(`\nNetwork: opBNB ${NETWORK} (chain ${CHAIN_ID})`);
  console.log("Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "BNB");

  if (balance === 0n) {
    console.error("\n❌ No gas! Get testnet BNB from https://opbnb-testnet-bridge.bnbchain.org/deposit");
    process.exit(1);
  }

  console.log("\nDeploying...");
  const factory = new ethers.ContractFactory(abi, "0x" + bin, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ VibeCheck deployed to:", address);
  console.log(`\nExplorer: https://${NETWORK === "mainnet" ? "opbnb" : "opbnb-testnet"}.bscscan.com/address/${address}`);
  console.log(`\nAdd to .env:\nVIBECHECK_CONTRACT_ADDRESS=${address}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
