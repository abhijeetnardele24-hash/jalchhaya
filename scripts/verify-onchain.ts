import { createPublicClient } from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ID } from "../src/types/schema";
import {
  validateOnchainEntities,
  VerificationStatuses,
  ValidatedEntitiesReport,
} from "../src/lib/verifierCore";

interface EvidenceArtifact {
  network: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    wsUrl: string;
    explorerUrl: string;
    verifiedBlockHeight: string;
    verifiedAt: string;
  };
  projectId: string;
  wallets: {
    creator: string;
    attester: string;
    submissionProof: string;
  };
  statuses: VerificationStatuses;
  entities: ValidatedEntitiesReport;
  onchainVerified: boolean;
  statusMessage: string;
}

const EVIDENCE_FILE = path.resolve(process.cwd(), "docs/live_evidence.json");

const EMPTY_ENTITIES: ValidatedEntitiesReport = {
  reliefPoints: [],
  observations: [],
  attestations: [],
  incidents: [],
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyOnchain() {
  console.log("==================================================================");
  console.log("      JalChhaya: Arkiv Tiramisu Strict On-Chain Verification      ");
  console.log("==================================================================");

  const rpcUrl = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
  const statuses: VerificationStatuses = {
    rpcReachable: false,
    chainIdVerified: false,
    projectQuerySuccessful: false,
    projectEntitiesValidated: false,
  };

  const wallets = {
    creator: "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279",
    attester: "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471",
    submissionProof: "0x4064bb37D501fb65d89edC7d454900D2De0Dc0d1",
  };

  function writeEvidence(
    blockHeight: string,
    onchainVerified: boolean,
    statusMessage: string,
    entities: ValidatedEntitiesReport = EMPTY_ENTITIES
  ) {
    const artifact: EvidenceArtifact = {
      network: {
        chainId: 7738577,
        chainName: "Arkiv Tiramisu Testnet",
        rpcUrl,
        wsUrl: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
        explorerUrl: "https://tiramisu.explorer.arkiv.network",
        verifiedBlockHeight: blockHeight,
        verifiedAt: new Date().toISOString(),
      },
      projectId: PROJECT_ID,
      wallets,
      statuses,
      entities,
      onchainVerified,
      statusMessage,
    };
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(artifact, null, 2), "utf8");
    console.log(`[EVIDENCE] Written to ${EVIDENCE_FILE}`);
  }

  // CHECK 1: RPC Reachability
  console.log(`[CHECK 1/4] Connecting to RPC endpoint: ${rpcUrl}`);
  let client;
  let blockNumber = 0n;
  try {
    client = createPublicClient({
      chain: tiramisu,
      transport: http(rpcUrl, { retryCount: 0, timeout: 8000 }),
    });
    blockNumber = await client.getBlockNumber();
    statuses.rpcReachable = true;
    console.log(`  [PASS] RPC is reachable. Current Live Block Height: #${blockNumber.toString()}`);
  } catch (err: any) {
    console.error("  [FAIL] Unable to connect to Arkiv Tiramisu RPC endpoint:", err?.message || err);
    writeEvidence(
      "0",
      false,
      `RPC unreachable: ${err?.message || "Connection refused"}`
    );
    process.exit(1);
  }

  // CHECK 2: Chain ID Validation
  console.log("[CHECK 2/4] Validating Chain ID...");
  const chainId = await client.getChainId();
  if (chainId !== 7738577) {
    console.error(`  [FAIL] Expected Chain ID 7738577 (Tiramisu), got: ${chainId}`);
    writeEvidence(
      blockNumber.toString(),
      false,
      `Invalid chain ID: expected 7738577, got ${chainId}`
    );
    process.exit(1);
  }
  statuses.chainIdVerified = true;
  console.log(`  [PASS] Chain ID verified: ${chainId} (Arkiv Tiramisu Testnet)`);

  // CHECK 3: Project Query Execution (with bounded retry for transient RPC load)
  console.log(`[CHECK 3/4] Querying on-chain entities for project: '${PROJECT_ID}' (with full attributes)...`);
  let result: any = null;
  const maxAttempts = 2;
  let lastQueryError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxAttempts} fetching entities via client.select({ attributes: true, ... })...`);
      const queryPromise = client
        .select({
          key: true,
          creator: true,
          owner: true,
          createdAt: true,
          expiresAt: true,
          creationFlags: true,
          attributes: true,
          payload: true,
        })
        .where(eq("project_id", str(PROJECT_ID)))
        .limit(50)
        .fetch();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Arkiv query timed out after 12 seconds")), 12000)
      );

      result = (await Promise.race([queryPromise, timeoutPromise])) as any;
      statuses.projectQuerySuccessful = true;
      console.log(`  [PASS] Query executed successfully on attempt ${attempt}.`);
      break;
    } catch (err: any) {
      lastQueryError = err;
      const isRateLimit =
        err?.message?.includes("429") ||
        err?.message?.includes("ANON_COST_LIMITED") ||
        err?.message?.includes("budget exhausted");

      if (isRateLimit) {
        console.warn(`  [ATTEMPT ${attempt} RATE LIMITED] HTTP 429 ANON_COST_LIMITED: Public unauthenticated query budget exhausted.`);
      } else {
        console.warn(`  [ATTEMPT ${attempt} FAILED] ${err?.message || err}`);
      }

      if (attempt < maxAttempts) {
        console.log("  Waiting 2000ms before retry...");
        await sleep(2000);
      }
    }
  }

  if (!statuses.projectQuerySuccessful) {
    const isRateLimit =
      lastQueryError?.message?.includes("429") ||
      lastQueryError?.message?.includes("ANON_COST_LIMITED") ||
      lastQueryError?.message?.includes("budget exhausted");

    const errorMsg = isRateLimit
      ? "Arkiv public RPC rate-limited (HTTP 429 ANON_COST_LIMITED): unauthenticated query budget exhausted. Fund testnet wallets at https://hub.arkiv.network/faucet to broadcast transactions."
      : `Arkiv compound query failed: ${lastQueryError?.message || "Unknown error"}`;

    console.error(`  [FAIL] ${errorMsg}`);
    writeEvidence(blockNumber.toString(), false, errorMsg);
    console.error("==================================================================");
    console.error("  [FAIL] On-chain verification failed as required by strict test.");
    console.error("==================================================================");
    process.exit(1);
  }

  // CHECK 4: Validate Entity Schemas, Provenance, Expiry, and Cross-Entity References
  console.log("[CHECK 4/4] Validating schema fields, creator provenance, expiry, and relational integrity...");
  const rawEntities = result?.entities || [];
  console.log(`  Received ${rawEntities.length} entities matching project_id '${PROJECT_ID}'.`);

  const validation = validateOnchainEntities(rawEntities);

  if (!validation.ok) {
    console.error(`  [FAIL] Entity validation failed (${validation.code}): ${validation.error}`);
    console.error("  Action required:");
    console.error("  1. Fund the dedicated wallets via https://hub.arkiv.network/faucet");
    console.error(`     Creator Address:  ${wallets.creator}`);
    console.error(`     Attester Address: ${wallets.attester}`);
    console.error("  2. Broadcast genuine entities: npm run seed");
    console.error("  3. Rerun: npm run verify-onchain");

    writeEvidence(blockNumber.toString(), false, `Validation failed: ${validation.error}`);
    console.error("==================================================================");
    console.error("  [FAIL] On-chain verification failed as required by strict test.");
    console.error("==================================================================");
    process.exit(1);
  }

  statuses.projectEntitiesValidated = true;
  console.log(`  [PASS] ${validation.summary}`);

  // All checks passed! Record truth
  writeEvidence(
    blockNumber.toString(),
    true,
    `Successfully verified ${rawEntities.length} live on-chain entities on Arkiv Tiramisu at block #${blockNumber.toString()}. ${validation.summary}`,
    validation.entities
  );

  console.log("==================================================================");
  console.log("       ALL TIRAMISU ON-CHAIN VERIFICATIONS PASSED GENUINELY       ");
  console.log("==================================================================");
}

verifyOnchain().catch((err) => {
  console.error("[FATAL] Verification process failed:", err);
  process.exit(1);
});
