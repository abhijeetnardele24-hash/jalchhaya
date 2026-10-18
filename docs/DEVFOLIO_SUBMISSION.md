# Devfolio Official Submission Package

**Project Name**: JalChhaya (जलछाया)  
**One-line Pitch**: Verifiable extreme-heat relief availability network for Pune outdoor workers using Arkiv native entity expiration and decentralized attestation.  
**Primary Track**: Best Indian Use Case ($2,000 USDC + Devcon 8 Ticket)  
**Secondary Track**: Security / Censorship Resistance  
**Author / Team**: Abhijeet Nardele (India)  
**GitHub Repository**: `https://github.com/abhijeetnardele24-hash/jalchhaya`  
**Live Web Application**: `https://abhijeetnardele24-hash.github.io/jalchhaya/`  
**License**: MIT License (`LICENSE`)  
**Target Network**: Arkiv Tiramisu Testnet (`Chain ID: 7738577`)  
**HTTP RPC**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**WebSocket RPC**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`  
**Tiramisu Block Explorer**: `https://tiramisu.explorer.arkiv.network`  
**Dedicated Creator Wallet**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`  
**Independent Attester Wallet**: `0x5b52b2516184Cc635D1A1Bc410697E3a070aa471`  

---

## 1. Project Overview & Problem Statement

### What is the problem?
During peak Indian summer, Pune frequently records temperatures above 42°C, causing extreme heat stress for over 200,000 gig delivery partners (Swiggy, Zomato, Blinkit, Dunzo), auto-rickshaw drivers, and street vendors. While drinking water kiosks (पाणपोई), shaded sheds, and municipal cooling rooms exist across Pune's 8 municipal zones, workers face an acute coordination failure:
- **Dry or Broken Facilities**: Traveling kilometers in 43°C heat only to find an unshaded or empty water dispenser.
- **Outdated Web2 Registries**: Centralized government portals are static and fail to reflect dynamic conditions like queue length, filter breakdowns, or water temperature.
- **Censorship & Manipulation**: Centralized civic databases can arbitrarily remove citizen outage complaints or hide municipal infrastructure failures.

### What is JalChhaya?
JalChhaya is a decentralized, verifiable heat-relief availability network built directly on the **Arkiv Network** without centralized indexers or Web2 databases. It turns Arkiv's native entity lifecycle—typed attribute storage, automated entity expiration (`ExpirationTime`), permissionless lifetime extension, and creator provenance (`$creator`)—into a critical public health utility for Indian outdoor workers.

---

## 2. Arkiv Network Deep Integration

JalChhaya implements Arkiv as the authoritative state layer for four distinct entity contracts:

| Entity Type | Arkiv Storage Attributes | Native Expiry (`ExpirationTime`) | Use Case in JalChhaya |
|---|---|---|---|
| `relief_point` | `project_id`, `entity_type`, `city`, `zone`, `geohash5`, `resource_type`, `accessibility`, `operator_class` | 180 days (`permissionlessExtension: true`) | Canonical registry of water kiosks, cooling rooms, and shaded pavilions across Pune. |
| `availability_observation` | `project_id`, `entity_type`, `relief_point_key`, `zone`, `resource_type`, `status`, `severity` (1–5) | 1–4 hours (dynamic by severity) | Ground truth reports on water flow, temperature, and queue depth. Automatically purges stale state. |
| `attestation` | `project_id`, `entity_type`, `relief_point_key`, `observation_key`, `verdict` (`confirm` \| `challenge`) | 4 hours | Peer review by other workers. Cryptographically tied to `$creator` wallet address. |
| `incident` | `project_id`, `entity_type`, `zone`, `severity`, `resolved` | 12–24 hours | Urgent heat alerts, pipe bursts, and localized microclimate heat spikes. |

### 7 Mandatory Compound SDK Queries Implemented:
1. Query active facilities in Pune: `select().where({ project_id: str("jalchhaya-pune-2026"), entity_type: str("relief_point") })`
2. Municipal zone filtering (e.g. Swargate, Deccan, Hadapsar): `where({ zone: str("swargate") })`
3. Resource classification filtering (e.g. Water, Shaded Shelter): `where({ resource_type: str("water") })`
4. Facility-specific observation history: `where({ relief_point_key: key(pointKey) })`
5. High-severity outage query: `where({ status: str("unavailable"), severity: gte(3) })`
6. Independent peer attestations: `where({ observation_key: key(obsKey) })`
7. Unresolved municipal emergencies: `where({ entity_type: str("incident"), resolved: i32(0) })`

---

## 3. The "Judge Drawer": Arkiv On-Chain Evidence Inspector

Unlike conventional hackathon demos that rely on mocked mockups, JalChhaya features a built-in **Arkiv On-Chain Evidence Inspector** available directly from any relief card:
- Displays the raw 32-byte immutable `entityKey`.
- Links to the `$creator` and `$owner` on the Tiramisu Explorer.
- Renders creation block and countdown to expiration block.
- Displays decoded typed storage attributes (`str`, `i32`, `u64`, `key`).
- Generates a **copyable, standalone TypeScript SDK code snippet** that judges can paste into their own terminal to reproduce the exact on-chain query.
- **Truthful Status Surfacing**: Explicitly distinguishes between **Live On-Chain Data** (when RPC queries succeed), **Demonstration Fixtures** (for offline and evaluated flows), and **Degraded Public RPC** (when public rate limits like `ANON_COST_LIMITED` are active).

---

## 4. Privacy & Indian DPDP Act Principles

JalChhaya implements a privacy-minimizing design aligned with data-minimization principles of India's Digital Personal Data Protection (DPDP) Act, 2023 without making unverified legal compliance claims:
- **Zero PII On-Chain**: No worker names, personal phone numbers, or vehicle plates are ever recorded on Arkiv.
- **Landmark-Based Location Hints**: Addresses reference public transit hubs (e.g. "Opposite Platform 3, Deccan PMT Bus Stand") rather than private residential locations.
- **Geohash-5 Coarsening**: Geohashes are capped at 5 characters (~4.9 km precision), preventing worker tracking.
- **Automated Data Eviction**: Ephemeral availability observations expire on-chain within hours, ensuring workers' daily travel patterns cannot be harvested or tracked.

---

## 5. Technical Rigor & Testing

- **Test Suite**: 54 unit tests across 6 test suites with **93.33% statement coverage**, **75.78% function coverage**, and **81.66% branch coverage** using Vitest and `@vitest/coverage-v8`.
- **Accessibility**: Automated Axe WCAG 2.2 AA audits (landing, evidence drawer, modals) and keyboard traversal across 7 viewports (320px–1920px), reporting zero critical or serious Axe violations (automated scans, not certified screen-reader testing).
- **Responsiveness & Offline**: 63/63 Playwright E2E tests passing with zero horizontal overflow verified across 320px, 360px, 390px, 768px, 1024px, 1440px, and 1920px viewports, including service-worker offline reading.
- **Trilingual Localization**: Native support for Marathi (मराठी), Hindi (हिंदी), and English.
- **Security**: Comprehensive secret scanner verifying full Git commit history, git-tracked files, and production dist bundle for zero leaked credentials or private keys, plus zero high/critical vulnerabilities in `npm audit`.
- **On-Chain Verification State**: Live Tiramisu RPC connection and Chain ID `7738577` strictly verified at block `#734712`. Live entity broadcast gated on testnet faucet funding due to unauthenticated RPC query limits (`ANON_COST_LIMITED`). Transparent machine-readable evidence artifact maintained in `docs/live_evidence.json`.
