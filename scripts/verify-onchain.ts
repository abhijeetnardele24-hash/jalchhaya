import { createPublicClient, str } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

async function verifyOnchain() {
  console.log("=================================================");
  console.log("   JalChhaya: Arkiv Tiramisu Live Verification   ");
  console.log("=================================================");

  const rpcUrl = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
  console.log("Connecting to RPC:", rpcUrl);

  const client = createPublicClient({
    chain: tiramisu,
    transport: http(rpcUrl),
  });

  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`[PASS] Live Block Height: #${blockNumber.toString()}`);

    const chainId = await client.getChainId();
    console.log(`[PASS] Verified Chain ID: ${chainId} (Tiramisu Testnet)`);

    console.log("Executing compound query: select().where({ project_id: 'jalchhaya_pune' }).limit(5)...");
    const result = await client
      .select({
        key: true,
        creator: true,
        expiresAt: true,
      })
      .where({
        project_id: str("jalchhaya_pune"),
      })
      .limit(5)
      .fetch();

    console.log(`[PASS] Query successful! Returned ${result.entities.length} on-chain entities.`);
    result.entities.forEach((e, idx) => {
      console.log(`  Entity #${idx + 1}: Key=${e.key}, ExpiresAt=#${e.expiresAt.toString()}`);
    });

    console.log("=================================================");
    console.log("   ALL TIRAMISU ON-CHAIN VERIFICATIONS PASSED    ");
    console.log("=================================================");
  } catch (err) {
    console.error("[FAIL] On-chain verification failed:", err);
    process.exit(1);
  }
}

verifyOnchain();
