import { createPublicClient } from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ID } from "../src/types/schema";

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
  };
  entities: {
    reliefPoints: Array<{ key: string; creator: string; expiresAt: string; zone: string; resourceType: string }>;
    observations: Array<{ key: string; creator: string; reliefPointKey: string; status: string }>;
    attestations: Array<{ key: string; creator: string; observationKey: string; verdict: string }>;
    incidents: Array<{ key: string; creator: string; incidentType: string; severity: number }>;
  };
  onchainVerified: boolean;
  statusMessage: string;
}

const EVIDENCE_FILE = path.resolve(process.cwd(), "docs/live_evidence.json");

async function verifyOnchain() {
  console.log("==================================================================");
  console.log("      JalChhaya: Arkiv Tiramisu Strict On-Chain Verification      ");
  console.log("==================================================================");

  const rpcUrl = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
  console.log(`[CHECK 1/5] Connecting to RPC endpoint: ${rpcUrl}`);

  let client;
  let blockNumber: bigint;
  try {
    client = createPublicClient({
      chain: tiramisu,
      transport: http(rpcUrl, { retryCount: 0, timeout: 5000 }),
    });
    blockNumber = await client.getBlockNumber();
    console.log(`  [PASS] RPC is healthy. Current Live Block Height: #${blockNumber.toString()}`);
  } catch (err) {
    console.error("  [FAIL] Unable to connect to Arkiv Tiramisu RPC endpoint:", err);
    process.exit(1);
  }

  console.log("[CHECK 2/5] Validating Chain ID...");
  const chainId = await client.getChainId();
  if (chainId !== 7738577) {
    console.error(`  [FAIL] Expected Chain ID 7738577 (Tiramisu), got: ${chainId}`);
    process.exit(1);
  }
  console.log(`  [PASS] Chain ID verified: ${chainId} (Arkiv Tiramisu Testnet)`);

  console.log(`[CHECK 3/5] Querying on-chain entities for project: '${PROJECT_ID}'...`);
  let result;
  try {
    const queryPromise = client
      .select({
        key: true,
        creator: true,
        expiresAt: true,
      })
      .where(eq("project_id", str(PROJECT_ID)))
      .limit(20)
      .fetch();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Arkiv query timed out after 10 seconds")), 10000)
    );

    result = (await Promise.race([queryPromise, timeoutPromise])) as any;
  } catch (err: any) {
    console.error("  [FAIL] Arkiv compound query failed or rate-limited:", err?.message || err);
    const unseededArtifact: EvidenceArtifact = {
      network: {
        chainId,
        chainName: "Arkiv Tiramisu Testnet",
        rpcUrl,
        wsUrl: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
        explorerUrl: "https://explorer.tiramisu.db-chain.testnet.arkiv.network",
        verifiedBlockHeight: blockNumber.toString(),
        verifiedAt: new Date().toISOString(),
      },
      projectId: PROJECT_ID,
      wallets: {
        creator: "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279",
        attester: "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471",
      },
      entities: {
        reliefPoints: [],
        observations: [],
        attestations: [],
        incidents: [],
      },
      onchainVerified: false,
      statusMessage: `Query failed / rate-limited: ${err?.message || "Unauthenticated query budget exhausted"}. Fund wallets at https://hub.arkiv.network/faucet to broadcast.`,
    };
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(unseededArtifact, null, 2), "utf8");
    console.error("==================================================================");
    console.error("  [FAIL] On-chain verification failed as required by strict test.");
    console.error("==================================================================");
    process.exit(1);
  }

  const entities = result?.entities || [];
  console.log(`  Found ${entities.length} on-chain entities matching project_id '${PROJECT_ID}'.`);

  // STRICT REQUIREMENT: Must fail if zero entities exist on-chain
  if (entities.length === 0) {
    console.error("==================================================================");
    console.error(`  [FAIL] ZERO on-chain entities found for project '${PROJECT_ID}'.`);
    console.error("  An empty query result CANNOT be accepted as on-chain verification.");
    console.error("  Action required:");
    console.error("  1. Fund the dedicated wallets via https://hub.arkiv.network/faucet");
    console.error("     Creator Address:  0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279");
    console.error("     Attester Address: 0x5b52b2516184Cc635D1A1Bc410697E3a070aa471");
    console.error("  2. Broadcast genuine entities: npm run seed");
    console.error("  3. Rerun: npm run verify-onchain");
    console.error("==================================================================");

    // Record truthful unseeded status in machine-readable artifact
    const unseededArtifact: EvidenceArtifact = {
      network: {
        chainId,
        chainName: "Arkiv Tiramisu Testnet",
        rpcUrl,
        wsUrl: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
        explorerUrl: "https://explorer.tiramisu.db-chain.testnet.arkiv.network",
        verifiedBlockHeight: blockNumber.toString(),
        verifiedAt: new Date().toISOString(),
      },
      projectId: PROJECT_ID,
      wallets: {
        creator: "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279",
        attester: "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471",
      },
      entities: {
        reliefPoints: [],
        observations: [],
        attestations: [],
        incidents: [],
      },
      onchainVerified: false,
      statusMessage: "Zero on-chain entities found. Awaiting testnet faucet gas for initial seeding.",
    };
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(unseededArtifact, null, 2), "utf8");
    process.exit(1);
  }

  console.log("[CHECK 4/5] Validating entity contracts and relationships...");
  const reliefPoints: any[] = [];
  const observations: any[] = [];
  const attestations: any[] = [];
  const incidents: any[] = [];

  for (const entity of entities) {
    const attrs = entity.attributes as Record<string, { value: any }>;
    const entityType = attrs?.entity_type?.value;
    const projId = attrs?.project_id?.value;

    if (projId !== PROJECT_ID) {
      console.error(`  [FAIL] Entity ${entity.key} has invalid project_id: ${projId}`);
      process.exit(1);
    }

    if (entityType === "relief_point") {
      reliefPoints.push({
        key: entity.key,
        creator: entity.creator || entity.owner,
        expiresAt: entity.expiresAt.toString(),
        zone: attrs?.zone?.value,
        resourceType: attrs?.resource_type?.value,
      });
    } else if (entityType === "availability_observation") {
      observations.push({
        key: entity.key,
        creator: entity.creator || entity.owner,
        reliefPointKey: attrs?.relief_point_key?.value,
        status: attrs?.status?.value,
      });
    } else if (entityType === "attestation") {
      attestations.push({
        key: entity.key,
        creator: entity.creator || entity.owner,
        observationKey: attrs?.observation_key?.value,
        verdict: attrs?.verdict?.value,
      });
    } else if (entityType === "incident") {
      incidents.push({
        key: entity.key,
        creator: entity.creator || entity.owner,
        incidentType: attrs?.incident_type?.value,
        severity: attrs?.severity?.value,
      });
    }
  }

  console.log(`  Parsed: ${reliefPoints.length} relief_points, ${observations.length} observations, ${attestations.length} attestations, ${incidents.length} incidents.`);

  // Verify entity relationships
  const reliefPointKeys = new Set(reliefPoints.map((p) => p.key.toLowerCase()));
  for (const obs of observations) {
    if (obs.reliefPointKey && !reliefPointKeys.has(obs.reliefPointKey.toLowerCase())) {
      console.warn(`  [WARN] Observation ${obs.key} references unknown reliefPointKey: ${obs.reliefPointKey}`);
    }
  }

  console.log("[CHECK 5/5] Generating machine-readable on-chain evidence artifact...");
  const evidenceArtifact: EvidenceArtifact = {
    network: {
      chainId,
      chainName: "Arkiv Tiramisu Testnet",
      rpcUrl,
      wsUrl: "wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
      explorerUrl: "https://explorer.tiramisu.db-chain.testnet.arkiv.network",
      verifiedBlockHeight: blockNumber.toString(),
      verifiedAt: new Date().toISOString(),
    },
    projectId: PROJECT_ID,
    wallets: {
      creator: "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279",
      attester: "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471",
    },
    entities: {
      reliefPoints,
      observations,
      attestations,
      incidents,
    },
    onchainVerified: true,
    statusMessage: `Successfully verified ${entities.length} live on-chain entities on Arkiv Tiramisu at block #${blockNumber.toString()}.`,
  };

  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidenceArtifact, null, 2), "utf8");
  console.log(`  [PASS] Evidence saved to ${EVIDENCE_FILE}`);

  console.log("==================================================================");
  console.log("       ALL TIRAMISU ON-CHAIN VERIFICATIONS PASSED GENUINELY       ");
  console.log("==================================================================");
}

verifyOnchain().catch((err) => {
  console.error("[FATAL] Verification process failed:", err);
  process.exit(1);
});
