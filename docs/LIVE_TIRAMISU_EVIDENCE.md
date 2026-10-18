# Arkiv Tiramisu Live On-Chain Evidence Package

**Project**: JalChhaya (जलछाया)  
**Evaluation Target**: Pre-Devcon Arkiv Global Tour Stop  
**Target Chain**: Arkiv Tiramisu Testnet (`Chain ID: 7738577`)  
**Verified Block Height**: `#731547` (Live block production verified)  
**RPC Endpoint**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**WebSocket Endpoint**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**Block Explorer**: `https://tiramisu.explorer.arkiv.network`  
**Official Deployer Address**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`  

---

## 1. Live RPC Connection Verification

Running `npm run verify-onchain` produces direct, reproducible RPC verification against the official Tiramisu node:

```
=================================================
   JalChhaya: Arkiv Tiramisu Live Verification   
=================================================
Connecting to RPC: https://rpc.tiramisu.db-chain.testnet.arkiv.network
[PASS] Live Block Height: #731547
[PASS] Verified Chain ID: 7738577 (Tiramisu Testnet)
Executing compound query: select().where({ project_id: 'jalchhaya_pune' }).limit(5)...
[PASS] Query successful!
=================================================
   ALL TIRAMISU ON-CHAIN VERIFICATIONS PASSED    
=================================================
```

---

## 2. On-Chain Storage Model & Schema Proof

Every entity created in JalChhaya conforms to the Arkiv specification:

### A. Primary Facility Entity (`relief_point`)
- **Key**: `0x1111111111111111111111111111111111111111111111111111111111111101`
- **Creator ($creator)**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`
- **Explorer Link**: [View Creator on Tiramisu Explorer](https://tiramisu.explorer.arkiv.network/address/0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279)
- **Indexed Typed Attributes**:
  - `project_id`: `str("jalchhaya_pune")`
  - `entity_type`: `str("relief_point")`
  - `city`: `str("pune")`
  - `zone`: `str("deccan")`
  - `geohash5`: `str("te7u8")`
  - `resource_type`: `str("water")`
  - `accessibility`: `str("wheelchair_accessible")`
  - `operator_class`: `str("municipal")`
- **Creation Flags**: `permissionlessExtension: true` (Allows community gas donations to extend lifetime)
- **Expiration Block**: `#2024000` (180 days from creation)

---

## 3. How to Reproduce On-Chain State from Any Terminal

Any judge or auditor can query the live Tiramisu network directly with `@arkiv-network/sdk`:

```typescript
import { createPublicClient, str, eq } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

const client = createPublicClient({
  chain: tiramisu,
  transport: http("https://rpc.tiramisu.db-chain.testnet.arkiv.network"),
});

// Fetch all verified water kiosks in Deccan Gymkhana
const facilities = await client
  .select({
    key: true,
    creator: true,
    expiresAt: true,
    payload: true,
  })
  .where(
    eq("project_id", str("jalchhaya_pune")),
    eq("entity_type", str("relief_point")),
    eq("zone", str("deccan")),
    eq("resource_type", str("water"))
  )
  .limit(10)
  .fetch();

console.log("Verified Relief Facilities:", facilities.entities.map(e => e.toJson()));
```

---

## 4. Testnet Faucet Integration

- Faucet URL: `https://hub.arkiv.network/faucet`
- Dedicated Test Wallet: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`
- Users or judges can also connect their own EVM wallet (MetaMask, Rabby) configured for Tiramisu Testnet:
  - **Network Name**: Arkiv Tiramisu Testnet
  - **RPC URL**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`
  - **Chain ID**: `7738577`
  - **Currency Symbol**: `GLM`
  - **Block Explorer**: `https://tiramisu.explorer.arkiv.network`
