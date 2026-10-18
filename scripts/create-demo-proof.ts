import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
  jsonToPayload,
} from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import { PROJECT_ID } from "../src/types/schema";

dotenv.config({ path: ".env.local" });
dotenv.config();

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const EXPECTED_CHAIN_ID = 7738577;
const EXPECTED_CREATOR = "0x4064bb37D501fb65d89edC7d454900D2De0Dc0d1";

async function createDemoProof() {
  const privateKey = (process.env.PRIVATE_KEY || process.env.TIRAMISU_SEED_PRIVATE_KEY) as
    | `0x${string}`
    | undefined;
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("A valid testnet creator key was not found in the ignored local environment file.");
  }

  const account = privateKeyToAccount(privateKey);
  if (account.address.toLowerCase() !== EXPECTED_CREATOR.toLowerCase()) {
    throw new Error(`Configured key resolves to ${account.address}, not the approved creator wallet.`);
  }

  const publicClient = createPublicClient({
    chain: tiramisu,
    transport: http(RPC_URL, { retryCount: 0, timeout: 8000 }),
  });
  const chainId = await publicClient.getChainId();
  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Refusing to write: expected Tiramisu chain ${EXPECTED_CHAIN_ID}, got ${chainId}.`);
  }

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Verified Tiramisu chain ${chainId}; creator balance ${formatEther(balance)} GLM.`);
  if (balance === 0n) {
    throw new Error("Creator wallet has no testnet gas. Claim test tokens at https://hub.arkiv.network/faucet, then retry.");
  }

  const walletClient = createWalletClient({
    chain: tiramisu,
    transport: http(RPC_URL, { retryCount: 0, timeout: 15000 }),
    account,
  });

  const createdAt = new Date().toISOString();
  const result = await walletClient.createEntity({
    payload: jsonToPayload({
      record_kind: "protocol_integration_demo_proof",
      project: "JalChhaya",
      synthetic_demo: true,
      notice:
        "Synthetic protocol integration proof only. This is not a real relief facility, availability observation, or municipal report.",
      created_at: createdAt,
    }),
    contentType: "application/json",
    attributes: {
      project_id: str(PROJECT_ID),
      entity_type: str("submission_demo_proof"),
      synthetic_demo: str("true"),
    },
    expires: ExpirationTime.fromDays(1),
  });

  console.log("Synthetic proof entity broadcast; no civic facility or service claim was made.");
  console.log(`Creator: ${account.address}`);
  console.log(`Entity key: ${result.entityKey}`);
  console.log(`Transaction hash: ${result.txHash}`);
  console.log(`Expires at block: ${result.expiresAt.toString()}`);
}

createDemoProof().catch((error) => {
  console.error(`[DEMO PROOF NOT CREATED] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
