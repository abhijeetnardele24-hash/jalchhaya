import { createWalletClient, createPublicClient, str, i32, u64, key, jsonToPayload, ExpirationTime } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import { INITIAL_SYNTHETIC_POINTS, PROJECT_ID } from "../src/lib/mockData";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function seedTiramisu() {
  console.log("=================================================");
  console.log("   JalChhaya: Seed Script for Arkiv Tiramisu     ");
  console.log("=================================================");

  const rpcUrl = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
  const publicClient = createPublicClient({ chain: tiramisu, transport: http(rpcUrl) });
  
  const blockNumber = await publicClient.getBlockNumber();
  console.log(`Live Tiramisu Block Height: #${blockNumber.toString()}`);

  const rawPrivateKey = process.env.VITE_DEV_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!rawPrivateKey || !rawPrivateKey.startsWith("0x")) {
    console.log("[INFO] No private key detected in environment.");
    console.log("To seed entities directly on-chain:");
    console.log("1. Add VITE_DEV_PRIVATE_KEY=0x... to .env.local (never commit this file)");
    console.log("2. Fund the wallet using https://hub.arkiv.network/faucet");
    console.log("3. Re-run: npm run seed");
    return;
  }

  const account = privateKeyToAccount(rawPrivateKey as `0x${string}`);
  console.log(`Using deployer wallet: ${account.address}`);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Wallet Balance: ${balance.toString()} wei`);

  if (balance === 0n) {
    console.warn(`[WARN] Wallet ${account.address} has 0 gas on Tiramisu testnet.`);
    console.warn("Please request test gas at https://hub.arkiv.network/faucet to broadcast on-chain entities.");
    return;
  }

  const walletClient = createWalletClient({
    chain: tiramisu,
    transport: http(rpcUrl),
    account,
  });

  console.log(`Seeding ${INITIAL_SYNTHETIC_POINTS.length} canonical Pune relief points to Arkiv Tiramisu...`);

  for (const point of INITIAL_SYNTHETIC_POINTS) {
    try {
      console.log(`Broadcasting: ${point.payload.name} (${point.zone})...`);
      const payloadBytes = jsonToPayload(point.payload);

      const res = await walletClient.createEntity({
        payload: payloadBytes,
        attributes: {
          project_id: str(PROJECT_ID),
          entity_type: str("relief_point"),
          city: str("pune"),
          zone: str(point.zone),
          geohash5: str(point.geohash5),
          resource_type: str(point.resourceType),
          accessibility: str(point.accessibility),
          operator_class: str(point.operatorClass),
        },
        expires: ExpirationTime.fromDays(180),
      });

      console.log(`  -> Success! Entity Key: ${res.entityKey}`);
      console.log(`  -> Tx Hash: ${res.txHash}`);
      console.log(`  -> Expires At Block: #${res.expiresAt.toString()}`);
    } catch (err: any) {
      console.error(`  -> Failed to seed point ${point.payload.name}:`, err.message || err);
    }
  }

  console.log("=================================================");
  console.log("   Seed process completed.                       ");
  console.log("=================================================");
}

seedTiramisu();
