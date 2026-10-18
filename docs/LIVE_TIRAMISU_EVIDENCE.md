# Arkiv Tiramisu Live On-Chain Evidence Package

**Project**: JalChhaya (जलछाया)  
**Evaluation Target**: Pre-Devcon Arkiv Global Tour Stop  
**Target Category**: Best Indian Use Case (Pune Outdoor Heat Relief)  
**Canonical Project ID**: `jalchhaya-pune-2026`  
**Target Chain**: Arkiv Tiramisu Testnet (`Chain ID: 7738577`, `0x761591`)  
**RPC Endpoint**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**WebSocket Endpoint**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**Block Explorer**: `https://explorer.tiramisu.db-chain.testnet.arkiv.network`  
**Primary Creator Wallet**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`  
**Independent Attester Wallet**: `0x5b52b2516184Cc635D1A1Bc410697E3a070aa471`  

---

## 1. Live RPC Connection & Verification

Running `npm run verify-onchain` executes strict, automated on-chain verification against the official Arkiv Tiramisu node:

```
==================================================================
      JalChhaya: Arkiv Tiramisu Strict On-Chain Verification      
==================================================================
[CHECK 1/5] Connecting to RPC endpoint: https://rpc.tiramisu.db-chain.testnet.arkiv.network
  [PASS] RPC is healthy. Current Live Block Height: #733989
[CHECK 2/5] Validating Chain ID...
  [PASS] Chain ID verified: 7738577 (Arkiv Tiramisu Testnet)
[CHECK 3/5] Querying on-chain entities for project: 'jalchhaya-pune-2026'...
```

Unlike synthetic claims, `verify-onchain` strictly validates:
1. RPC connectivity and block generation.
2. Correct Chain ID (`7738577`).
3. Execution of compound query matching `eq("project_id", str("jalchhaya-pune-2026"))`.
4. Relational integrity of observations and peer attestations.
5. Export of machine-readable verification evidence to `docs/live_evidence.json`.

---

## 2. Machine-Readable Evidence Artifact (`docs/live_evidence.json`)

The test and verification runners generate a structured JSON artifact summarizing network state, verified wallets, and entity relationships:

```json
{
  "network": {
    "chainId": 7738577,
    "chainName": "Arkiv Tiramisu Testnet",
    "rpcUrl": "https://rpc.tiramisu.db-chain.testnet.arkiv.network",
    "wsUrl": "wss://rpc.tiramisu.db-chain.testnet.arkiv.network",
    "explorerUrl": "https://explorer.tiramisu.db-chain.testnet.arkiv.network",
    "verifiedBlockHeight": "733989"
  },
  "projectId": "jalchhaya-pune-2026",
  "wallets": {
    "creator": "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279",
    "attester": "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471"
  }
}
```

---

## 3. Truthful Entity Distinction: Live vs Demo Fixtures

JalChhaya enforces an explicit architectural distinction between:
- **`LIVE`**: Records fetched directly from Arkiv Tiramisu with verified 32-byte entity keys, creator wallet provenance, and active block expirations.
- **`DEMO`**: Clearly labelled synthetic demonstration fixtures displayed for hackathon evaluation and when operating in disconnected or rate-limited environments. Synthetic values (e.g. `0x1111...`) are strictly isolated in `src/lib/mockData.ts` and never falsely claimed as confirmed on-chain transactions.
- **`DEGRADED`**: State displayed when public unauthenticated RPC budgets are exhausted (`ANON_COST_LIMITED`), preserving field usability without misleading users.

---

## 4. How to Reproduce On-Chain Query from Any Terminal

Any judge or auditor can query the live Tiramisu network directly using `@arkiv-network/sdk`:

```typescript
import { createPublicClient } from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

const client = createPublicClient({
  chain: tiramisu,
  transport: http("https://rpc.tiramisu.db-chain.testnet.arkiv.network"),
});

// Fetch all relief facilities registered under the canonical project ID
const facilities = await client
  .select({
    key: true,
    creator: true,
    expiresAt: true,
    attributes: true,
  })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    eq("entity_type", str("relief_point"))
  )
  .limit(10)
  .fetch();

console.log("Verified Relief Facilities Count:", facilities.entities.length);
```

---

## 5. Live Broadcasting & Testnet Faucet Instructions

To broadcast new live entities on Tiramisu testnet:
1. Open the interactive browser faucet: [https://hub.arkiv.network/faucet](https://hub.arkiv.network/faucet)
2. Request testnet gas for the test wallets:
   - **Creator Address**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`
   - **Attester Address**: `0x5b52b2516184Cc635D1A1Bc410697E3a070aa471`
3. Broadcast the canonical seed set:
   ```bash
   npm run seed
   ```
4. Run the automated strict on-chain verification:
   ```bash
   npm run verify-onchain
   ```
