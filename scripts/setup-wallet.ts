import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http, formatEther } from "viem";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

let creatorPrivateKey = (process.env.PRIVATE_KEY || process.env.TIRAMISU_SEED_PRIVATE_KEY) as `0x${string}` | undefined;
let attesterPrivateKey = process.env.ATTESTER_PRIVATE_KEY as `0x${string}` | undefined;

let updated = false;
let envContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, "utf8") : "";

if (!creatorPrivateKey) {
  creatorPrivateKey = generatePrivateKey();
  envContent += `\nPRIVATE_KEY=${creatorPrivateKey}`;
  updated = true;
}

if (!attesterPrivateKey) {
  attesterPrivateKey = generatePrivateKey();
  envContent += `\nATTESTER_PRIVATE_KEY=${attesterPrivateKey}`;
  updated = true;
}

if (updated) {
  fs.writeFileSync(envLocalPath, envContent.trim() + "\n", { encoding: "utf8" });
  console.log("[INFO] Dedicated test wallets generated and saved to .env.local (strictly git-ignored).");
}

const creatorAccount = privateKeyToAccount(creatorPrivateKey);
const attesterAccount = privateKeyToAccount(attesterPrivateKey);

console.log("=================================================");
console.log("   JalChhaya: Dedicated Testnet Wallets          ");
console.log("=================================================");
console.log(`1. Primary Creator Wallet:   ${creatorAccount.address}`);
console.log(`2. Independent Attester:     ${attesterAccount.address}`);
console.log("-------------------------------------------------");

const publicClient = createPublicClient({ chain: tiramisu, transport: http("https://rpc.tiramisu.db-chain.testnet.arkiv.network") });

async function checkBalances() {
  const [creatorBal, attesterBal] = await Promise.all([
    publicClient.getBalance({ address: creatorAccount.address }),
    publicClient.getBalance({ address: attesterAccount.address }),
  ]);

  console.log(`Creator Balance:   ${formatEther(creatorBal)} ARKIV`);
  console.log(`Attester Balance:  ${formatEther(attesterBal)} ARKIV`);

  if (creatorBal === 0n || attesterBal === 0n) {
    console.log("-------------------------------------------------");
    console.log("[ACTION REQUIRED FOR ON-CHAIN BROADCASTING]");
    console.log("To fund both wallets for live Arkiv testnet seeding:");
    console.log("1. Open: https://hub.arkiv.network/faucet");
    console.log(`2. Request test gas for Creator:  ${creatorAccount.address}`);
    console.log(`3. Request test gas for Attester: ${attesterAccount.address}`);
    console.log("4. Once funded, run: npm run seed");
  }
}

checkBalances();
