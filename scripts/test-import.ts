import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

console.log("Arkiv Tiramisu Chain ID:", tiramisu.id);
const client = createPublicClient({ chain: tiramisu, transport: http() });
console.log("Arkiv Public Client initialized successfully!", Boolean(client));
