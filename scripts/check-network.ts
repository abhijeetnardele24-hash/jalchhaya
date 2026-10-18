import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

async function main() {
  const client = createPublicClient({ chain: tiramisu, transport: http() });
  try {
    const blockNumber = await client.getBlockNumber();
    console.log("Current Tiramisu Block Number:", blockNumber.toString());
  } catch (err) {
    console.error("Error reading block number:", err);
  }
}

main();
