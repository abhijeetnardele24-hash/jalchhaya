import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http, formatEther } from "viem";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

// Load existing .env.local if present
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

let privateKey = process.env.TIRAMISU_SEED_PRIVATE_KEY as `0x${string}` | undefined;

if (!privateKey) {
  privateKey = generatePrivateKey();
  const envContent = fs.existsSync(envLocalPath)
    ? fs.readFileSync(envLocalPath, "utf8")
    : "";
  const updatedEnv = `${envContent.trim()}\nTIRAMISU_SEED_PRIVATE_KEY=${privateKey}\n`;
  fs.writeFileSync(envLocalPath, updatedEnv, { encoding: "utf8" });
  console.log("Generated fresh dedicated Tiramisu test wallet and saved to .env.local (git-ignored).");
}

const account = privateKeyToAccount(privateKey);
console.log("Dedicated Tiramisu Test Wallet Address:", account.address);

const publicClient = createPublicClient({ chain: tiramisu, transport: http() });

async function checkBalance() {
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Current Balance: ${formatEther(balance)} GLM`);
  return balance;
}

checkBalance();
