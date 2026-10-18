# Arkiv Developer Experience & SDK Friction Report

**Project**: JalChhaya (जलछाया)  
**SDK Package**: `@arkiv-network/sdk` version `0.8.1`  
**Peer Dependency**: `viem` version `2.21.32`  
**Target Network**: Arkiv Tiramisu Testnet (`Chain ID: 7738577`)  
**HTTP RPC**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**WebSocket RPC**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**Block Explorer**: `https://tiramisu.explorer.arkiv.network`  
**Evaluator**: Abhijeet Nardele (Devcon Global Tour Hackathon)  
**Date**: October 18, 2026  

---

## Executive Summary

The Arkiv TypeScript SDK (`@arkiv-network/sdk` 0.8.1) delivers on its core promise: allowing developers to query on-chain entities with expressive, SQL-like compound filters (`select().where().limit()`) and define typed storage attributes (`str()`, `i32()`, `u64()`, `key()`). The protocol's built-in entity expiration (`ExpirationTime`) and permissionless lifetime extension model are unique and well-suited for ephemeral municipal data like heatwave relief availability.

However, during end-to-end integration of a high-throughput public availability network, our engineering team identified several concrete DX frictions, TypeScript typing gaps, and tooling obstacles. This document details reproducible friction points with code examples, expected vs. actual behaviors, and constructive recommendations for the Arkiv core engineering team.

---

## Friction Item 1: `watchEntityEvents` Configuration & Parameter Types

### Description
In `@arkiv-network/sdk`, the `PublicClient` extension includes `watchEntityEvents()`. When setting up real-time entity monitoring via WebSockets, developers typically want to subscribe starting from the current block or a recent block to replay unacknowledged events.

### Reproduction
```typescript
import { createPublicClient, webSocket } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";

const client = createPublicClient({
  chain: tiramisu,
  transport: webSocket("wss://rpc.tiramisu.db-chain.testnet.arkiv.network"),
});

// Passing fromBlock triggers TypeScript type error or runtime rejection
const unwatch = client.watchEntityEvents({
  fromBlock: "latest", // or 730000n
  onEntityCreated: (event) => console.log(event),
});
```

### Expected Behavior
`watchEntityEvents` should accept standard viem `WatchEventParameters` including `fromBlock?: BlockNumber | BlockTag`, enabling continuous syncing without missing events during WebSocket reconnects.

### Actual Behavior
The TypeScript definitions for `watchEntityEvents` in 0.8.1 strictly expect `{ onEntityCreated?, onEntityPatched?, onExpiryExtended?, onError? }`. Passing `fromBlock` fails compilation unless cast with `as any`.

### Workaround Applied in JalChhaya
Subscribed without `fromBlock` and invoked an immediate REST query upon socket reconnection to reconcile pending state:
```typescript
const unwatch = client.watchEntityEvents({
  onEntityCreated: (event) => onEvent("EntityCreated", event.entityKey),
  onEntityPatched: (event) => onEvent("EntityPatched", event.entityKey),
  onExpiryExtended: (event) => onEvent("ExpiryExtended", event.entityKey),
  onError: (err) => console.warn("WebSocket error:", err),
});
```

---

## Friction Item 2: Faucet HTTP Endpoint Requires Interactive Session (No Headless CI / Devnet Funding)

### Description
Automated integration testing and autonomous deployment require requesting testnet funds programmatically for freshly generated test wallets.

### Reproduction
```bash
curl -X POST https://hub.arkiv.network/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"}'
```

### Expected Behavior
A dedicated developer faucet API or testnet faucet endpoint that accepts a wallet address and dispenses test gas (e.g. 0.05 Tiramisu gas / GLM token) with IP rate-limiting, or an API key for hackathon participants.

### Actual Behavior
The endpoint returns `401 Unauthorized` / HTML redirect because faucet distribution is tightly coupled to the web UI session on `hub.arkiv.network`.

### Recommendation
Provide a CLI or API faucet endpoint (`POST /api/v1/faucet` with a Bearer token or rate-limited IP) for CI/CD test pipelines and autonomous development workflows.

---

## Friction Item 3: Attribute Name Length and Format Validation at Runtime vs. Compile Time

### Description
Arkiv entity attributes must be `snake_case` strings with a maximum length of 32 characters. If an attribute name exceeds 32 characters or contains invalid characters, the transaction reverts on-chain during RPC simulation rather than failing fast at compilation or parameter construction.

### Reproduction
```typescript
// Attribute name with 34 characters:
const attributes = {
  availability_observation_record_id: str("obs_1234"), // 34 characters!
};

await walletClient.createEntity({
  payload: jsonToPayload({ data: true }),
  attributes,
  expires: ExpirationTime.fromHours(2),
});
```

### Expected Behavior
TypeScript type `ExactAttributeName<T>` or a linting rule should warn at compile time if an object key exceeds 32 bytes. Alternatively, `createEntity` parameter validation should throw a clear client-side `InvalidAttributeNameError: Attribute 'availability_observation_record_id' exceeds 32 byte limit (length: 34)`.

### Actual Behavior
The RPC node returns an opaque execution error: `revert: attribute key too long`, requiring manual parameter inspection to identify the offending attribute.

### Workaround Applied in JalChhaya
We standardized all attribute names strictly within 12–24 characters (`project_id`, `entity_type`, `city`, `zone`, `geohash5`, `resource_type`, `accessibility`, `operator_class`, `status`, `severity`) and validated them with Zod in `src/types/schema.ts`.

---

## Friction Item 4: ExpirationTime Abstraction vs. Raw Block Numbers

### Description
The SDK provides `ExpirationTime.fromHours(n)` and `ExpirationTime.fromDays(n)`. When an entity is queried back using `select()`, the returned entity object has `expiresAt: bigint` representing the raw block number at which the entity expires.

### Discrepancy
- Input parameter is expressed in wall-clock time (`ExpirationTime.fromHours(2)`).
- Output property is expressed as an absolute block number (`expiresAt: 734200n`).
- The SDK does not currently provide a helper like `client.estimateRemainingTime(expiresAt)` or `client.blockNumberToDate(expiresAt)` based on current block time and average block production duration.

### Workaround Applied in JalChhaya
We implemented our own block countdown estimator:
```typescript
// Average block time on Tiramisu testnet is ~2 seconds
const blocksRemaining = expiresAt - currentBlockHeight;
const secondsRemaining = Number(blocksRemaining) * 2;
```

---

## Friction Item 5: Explorer Contract Verification & Deep Query Links

### Description
The Tiramisu testnet block explorer (`https://tiramisu.explorer.arkiv.network`) displays raw transactions and contract interactions, but does not yet have a dedicated "Arkiv Entity Inspector" view where pasting a 32-byte `entityKey` automatically decodes the payload, displays typed attributes, and previews the expiration state.

### Innovation Built into JalChhaya to Solve This
Because the public explorer lacked an entity inspector, we built the **Arkiv On-Chain Evidence Inspector** directly inside the JalChhaya application. Any judge or user can click **"On-Chain Evidence"** on any card to view:
1. Exact entity key and `$creator` wallet.
2. Creation block and expiration block countdown.
3. Decoded typed storage attributes (`str`, `i32`, `u64`, `key`).
4. Decoded payload JSON.
5. Exact copyable `@arkiv-network/sdk` TypeScript code to reproduce the query from their own terminal.

---

## Summary of Recommendations

| Priority | Feature / Fix | Impact |
|---|---|---|
| **High** | Headless CLI/API Faucet for hackathon participants & CI | Unblocks automated testing and deployments |
| **High** | Add `fromBlock` to `watchEntityEvents` parameters | Enables historical event replay on reconnect |
| **Medium** | Client-side attribute name length validation (<32 bytes) | Prevents wasted transaction simulation gas |
| **Medium** | Add `estimateRemainingTime(expiresAt)` utility to SDK | Eliminates custom block-to-time math |
| **Low** | Entity Inspector tab on Tiramisu Explorer | Improves judge and developer transparency |
