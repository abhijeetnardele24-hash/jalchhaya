# JalChhaya (जलछाया) — Verifiable Extreme-Heat Relief Network

> **A verifiable public availability network for drinking-water, cooling shelters, and heat-relief amenities in Indian urban centers, anchored on Arkiv (Tiramisu Testnet `7738577`).**

[![CI Test & Quality Gates](https://github.com/abhijeetnardele24-hash/jalchhaya/actions/workflows/ci.yml/badge.svg)](https://github.com/abhijeetnardele24-hash/jalchhaya/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Network: Arkiv Tiramisu](https://img.shields.io/badge/Network-Arkiv%20Tiramisu%207738577-086F83.svg)](https://tiramisu.explorer.arkiv.network)
[![Automated Accessibility: Axe WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-Axe%20WCAG%202.2%20AA%20Verified-16A34A.svg)](./tests/e2e/accessibility.spec.ts)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%205.5-blue.svg)](./tsconfig.json)

---

## 📌 Executive Overview

Under guidelines from India's [National Centre for Disease Control (NCDC) / MoHFW National Action Plan on Heat-Related Illnesses](https://ncdc.mohfw.gov.in/wp-content/uploads/2024/03/National-Action-Plan-on-Heat-Related-Illnesses-2024.pdf) and the [India Meteorological Department (IMD) Heat Wave Guidelines](https://mausam.imd.gov.in/), outdoor workers—including gig delivery couriers (Swiggy, Zomato, Zepto, Dunzo), street vendors, transit staff, and construction laborers—face severe dehydration and exertion heat illness during summer periods when ambient temperatures exceed 40°C.

Existing civic resources typically provide static municipal directories or broad regional weather advisories. However, they lack real-time ground verification: a mapped drinking-water fountain or cooling shelter may be locked, dry, or out of service without warning. For field workers, detouring to an unverified facility wastes time and causes prolonged direct heat exposure.

**JalChhaya addresses three core verification challenges on the ground**:
1. **Current Operational Status**: Is a specific relief facility functional *right now* based on recent field reports?
2. **Cryptographic Provenance**: Who submitted this report, and is their wallet signature verifiable on-chain via immutable `$creator` provenance?
3. **Automated Expiration**: When does this report expire, ensuring outdated claims are evicted automatically so no worker is misled?

---

## 🏛️ Architectural Fit: Why Arkiv is Necessary

A municipal database, centralized API, or static IPFS hash fails this operational problem in distinct ways:

| Feature / Requirement | Centralized API / Postgres | IPFS / Filecoin | Subgraphs on L1/L2 | Arkiv Network (Tiramisu) |
|---|---|---|---|---|
| **Censorship & Modification Resistance** | ❌ Centralized administrative boundary allows modification or deletion of outage reports without cryptographic audit trails | 🟢 Content-addressed immutable storage | 🟢 On-chain smart contract event history | 🟢 **Immutable on-chain storage with cryptographic `$creator` provenance** |
| **Indexed Compound Multi-Predicate Queries** | 🟢 Native relational SQL (`SELECT ... WHERE`) | ❌ Lacks native querying; requires external indexing database | 🟡 High indexing latency across blocks & separate subgraph node dependencies | 🟢 **Native typed queries (`city` + `zone` + `status` + `severity`) directly at RPC layer** |
| **Automated Stale-Data Eviction** | 🟡 Requires centralized cron scripts and custom deletion jobs | ❌ Content persists indefinitely unless pinned nodes purge | ❌ Requires explicit, gas-costly smart contract state deletion transactions | 🟢 **Native entity TTL expiration (`expiresAt` parameter in seconds)** |
| **Permissionless Community Renewal** | ❌ Restricted by centralized API permissions | ❌ N/A | 🟡 Requires custom smart contract logic | 🟢 **Native `extend()` API allowing community lease renewals** |
| **Real-Time Push Subscriptions** | 🟡 Custom Webhooks / Polling | ❌ Not natively supported | 🟡 External webhook infrastructure | 🟢 **Native WebSocket entity event streaming (`watchEntityEvents`)** |

---

## 📸 Real Application Screenshots

The following screenshots are captured directly from the running production application using Playwright across desktop and mobile viewports. All displayed demonstration relief points are clearly tagged with civic source badges.

### 1. Desktop Wayfinding & Command Atlas (1280 × 820)
![JalChhaya Desktop Command Atlas](./docs/assets/screenshot-desktop-atlas.png)
*Figure 1: Desktop command interface showing the heat stress advisory banner, active Geohash-5 zone map, relief point cards, and trilingual language switcher. The amber degraded-state banner reflects that unauthenticated testnet queries are rate-limited (`ANON_COST_LIMITED`), activating the local simulated demonstration fixtures.*

### 2. On-Chain Evidence Inspector & SDK Reproduction
![JalChhaya On-Chain Evidence Inspector](./docs/assets/screenshot-evidence-inspector.png)
*Figure 2: The On-Chain Evidence Inspector drawer rendering raw entity attributes and copyable `@arkiv-network/sdk` query syntax. As shown by the amber banner, this displays deterministic simulated demonstration fixtures—not a verified live on-chain record—providing developers and judges with a working preview of attribute schemas and reproduction queries while live transaction broadcasting awaits testnet faucet funding.*

### 3. Mobile Wayfinding & Quick Action Feed (390 × 844)
<p align="center">
  <img src="./docs/assets/screenshot-mobile-feed.png" alt="JalChhaya Mobile Viewport Feed" width="390" />
</p>
*Figure 3: Mobile interface tailored for gig delivery riders wearing gloves: minimum 44×44px touch targets, high-contrast thermal status indicators, emergency helpline links, and trilingual toggling (English / Marathi / Hindi).*

---

## 🏗️ Code-Accurate Architecture & Data Flow

Below is the architectural diagram reflecting the exact implementation paths in `src/lib/arkivService.ts`, `src/App.tsx`, and `public/sw.js`:

![JalChhaya Architecture & Verified Code Paths](./docs/assets/architecture-diagram.svg)

### Data Flow Walkthrough

```mermaid
sequenceDiagram
    autonumber
    participant Worker as Gig Worker / Field User
    participant PWA as PWA Shell (React + SW)
    participant Service as ArkivService (Client)
    participant Arkiv as Arkiv Tiramisu (7738577)

    Note over Worker,PWA: 1. Read / Query Flow
    Worker->>PWA: Opens JalChhaya (Pune Zone)
    PWA->>Service: queryReliefPoints({ city: "Pune", status: "functional" })
    alt Online & Within Budget
        Service->>Arkiv: client.select().where(city, zone, status)
        Arkiv-->>Service: Return matching active entities
        Service-->>PWA: Render live relief points + set Live badge
        PWA->>PWA: Cache entities in IndexedDB & Service Worker
    else Offline or ANON_COST_LIMITED (HTTP 429)
        Service-->>PWA: Fallback to cached entries or labelled synthetic baseline
        PWA-->>Worker: Display relief points with "Degraded / Demo Mode" banner
    end

    Note over Worker,PWA: 2. Wallet-Signed Write Flow
    Worker->>PWA: Submits Observation (e.g., Water Dispenser Functional)
    alt Offline Mode
        PWA-->>Worker: Block write immediately ("Network offline. Connect to submit")
    else Online Mode
        PWA->>Service: submitObservation(formData, walletClient)
        Service->>Service: Validate with Zod (Zero-PII, spatial bounds)
        Service->>Arkiv: client.insert({ ...payload }).withExpiresIn(14400)
        Arkiv-->>Service: Transaction Hash + Entity ID
        Service-->>PWA: Update local state & trigger optimistic feedback
        PWA-->>Worker: "Report successfully broadcast on Arkiv"
    end
```

### Layer Details
1. **Field Client Layer (`src/App.tsx`, `public/sw.js`)**:
   - PWA caching with stale-while-revalidate for static assets and offline navigation fallback to `index.html`.
   - Responsive layouts tested from 320px mobile to 1920px wide desktop.
   - Trilingual localization: English, Marathi (`मराठी`), and Hindi (`हिंदी`).
2. **Integration & Resilience Layer (`src/lib/arkivService.ts`)**:
   - Manages connection to Arkiv testnet via `@arkiv-network/sdk` and `viem`.
   - Implements query fallbacks when public RPC unauthenticated limits (`ANON_COST_LIMITED`) are encountered.
   - Validates all input schemas using `zod` before broadcasting transactions.
3. **Authoritative Network Layer (`Arkiv Tiramisu 7738577`)**:
   - Native EVM state machine with structured attribute indexing.
   - Built-in TTL expiration: Observations expire after 1–4 hours; municipal incidents expire after 12–24 hours; relief points lease for 180 days.

---

## 🔒 Security & Privacy Boundary (Threat Model)

| Threat Vector | Mitigation Strategy in Code |
|---|---|
| **Worker Profiling / Surveillance** | **Strict Zero-PII Policy**: Names, phone numbers, vehicle numbers, and home addresses are strictly prohibited. Zod schemas (`src/lib/schemas.ts`) reject submissions containing personal identifiers. |
| **Location Tracking of Vulnerable Labor** | **Spatial Coarsening**: GPS coordinates are truncated to 3 decimal places (~110m precision) and indexed by Geohash-5 zones (~4.9km × 4.9km), preventing stalker profiling of street vendors or gig workers. |
| **Spam / Phantom Reports** | **Cryptographic Provenance**: Every observation and peer attestation requires a wallet signature. The immutable `$creator` attribute ties reports to signing accounts, enabling reputational filtering. |
| **Silent Offline Write Failure** | **Explicit Network Gating**: If the worker's device is offline, write submissions are blocked with an explicit warning banner rather than silently swallowed or falsely confirmed. |
| **Stale Relief Point Misinformation** | **Native On-Chain TTL**: Reports expire automatically on-chain via Arkiv's native `expiresAt` parameter, purging unverified facilities from queries without centralized cron intervention. |
| **Credential / Secret Leaking** | **Zero Secrets Policy**: No private keys or RPC secrets in client bundles or Git history. Validated by custom multi-stage security scanner streaming all Git commits. |

---

## 🚦 Project Status & Verification Truthfulness

We believe in complete, unembellished transparency:

1. **RPC & Chain ID**: Strictly verified on Arkiv Tiramisu at block `#739722` (Chain ID `7738577`); the current public project query returns `ANON_COST_LIMITED`, as recorded in [`docs/live_evidence.json`](./docs/live_evidence.json).
2. **Rate Limits & Faucet Status**: Public unauthenticated queries to the testnet RPC enforce an `ANON_COST_LIMITED` budget cap. Our live verifier (`scripts/verify-onchain.ts`) detects this cleanly.
3. **Live Entity Seeding**: Broadcast of canonical live on-chain entities is preserved as an active gating check that will complete once testnet wallets (`0x8Bcb...0279` and `0x5b52...a471`) receive testnet gas from the official faucet.
4. **Demonstration Baseline**: While testnet wallets await faucet funds, the application renders clearly labeled deterministic demonstration fixtures for Pune (`swargate`, `shivajinagar`, `hadapsar`, `kothrud`, `vimannagar`). Every card displays its source origin.
5. **Accessibility Scope**: Automated Axe audits verify zero critical or serious WCAG 2.2 AA violations across all 7 viewports. This confirms automated technical compliance; it does not claim certified manual testing with specific assistive screen readers (e.g., NVDA or TalkBack).

---

## 🧪 Comprehensive Quality Gates & Test Scope

All quality gates run locally and on GitHub Actions CI. Every gate must pass with zero errors:

| Quality Gate | Command | Scope & Configuration | Verified Result | Status |
|---|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | `tsc --noEmit` with strict null checks | **0 errors** | ✅ PASS |
| **Unit Test Suite** | `npm test` | Vitest: 73 tests across 8 test suites (App, components, schemas, security scanner, SDK service, verifier, proof flow) | **73/73 passed** (93.61% Stmts, 82.73% Branches, 78.30% Funcs) | ✅ PASS |
| **E2E & Accessibility** | `npm run test:e2e` | Playwright: 70 tests across 7 viewports (320, 360, 390, 768, 1024, 1440, 1920 px), automated Axe WCAG 2.2 AA checks, keyboard navigation | **70/70 passed** (0 critical / serious Axe violations) | ✅ PASS |
| **Service Worker E2E** | `tests/e2e/accessibility.spec.ts` | Strict `navigator.serviceWorker.ready` verification, correct origin scope, active worker state | **Verified active & controlling** | ✅ PASS |
| **Offline Recovery E2E** | `tests/e2e/accessibility.spec.ts` | Online warming, service worker controller readiness, offline browser reload, offline banner display, write rejection test | **Verified offline recovery & write rejection** | ✅ PASS |
| **Security Scan** | `npm run security-scan` | Commit-by-commit Git history stream (shallow-clone check enforced; `fetch-depth: 0` in CI), unignored working tree files, sensitive filename inspection, client bundle leak scan | **0 secrets detected across 7 commits & 64 files** | ✅ PASS |
| **Dependency Audit** | `npm run audit` | `npm audit --omit=dev --audit-level=high` | **0 high or critical vulnerabilities** | ✅ PASS |
| **Production Build** | `npm run build` | `vite build` production compilation, zero source map leaks | **Clean optimized build (`dist/`)** | ✅ PASS |
| **Live On-Chain Verifier** | `npm run verify-onchain` | Live RPC reachability, chain ID `7738577`, compound multi-predicate query check | **Block #739722 and chain ID verified; project query rate-limited; live proof awaits test GLM and wallet approval** | ⚠️ GATE ACTIVE |

---

## 🛠️ Prerequisites & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node `v22.14.0`)
- **npm**: `v9.0.0` or higher
- **Git**

### Installation & Execution

```bash
# 1. Clone repository
git clone https://github.com/abhijeetnardele24-hash/jalchhaya.git
cd jalchhaya

# 2. Install dependencies
npm install

# 3. Run typecheck and unit tests
npm run typecheck
npm test

# 4. Run Playwright E2E and Axe accessibility suite
npm run test:e2e

# 5. Run full-history security scanner
npm run security-scan

# 6. Verify live on-chain connection to Arkiv Tiramisu
npm run verify-onchain

# 7. Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173/`.

---

## 🌐 Live Network & Testnet Parameters

| Parameter | Value |
|---|---|
| **Network Name** | Arkiv Tiramisu Testnet |
| **Chain ID** | `7738577` |
| **Currency Symbol** | `GLM` |
| **RPC Endpoint** | `https://rpc.tiramisu.db-chain.testnet.arkiv.network` |
| **WebSocket Endpoint** | `wss://rpc.tiramisu.db-chain.testnet.arkiv.network` |
| **Block Explorer** | [tiramisu.explorer.arkiv.network](https://tiramisu.explorer.arkiv.network) |
| **Official Faucet** | [hub.arkiv.network/faucet](https://hub.arkiv.network/faucet) |
| **Synthetic fixture publisher identifier (not a live-write claim)** | `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279` |
| **Approved submission-proof wallet** | `0x4064bb37D501fb65d89edC7d454900D2De0Dc0d1` |
| **Fixture attester identifier (synthetic data)** | `0x5b52b2516184Cc635D1A1Bc410697E3a070aa471` |
| **Live Web App URL** | [abhijeetnardele24-hash.github.io/jalchhaya](https://abhijeetnardele24-hash.github.io/jalchhaya/) |

The app includes an optional **synthetic protocol proof** flow. It is locked to the approved wallet above, checks the Tiramisu network and test-token balance, asks MetaMask to review the transaction, writes no civic location/status, and sets the record to expire after one day. A live proof is **not claimed until the entity is found through Arkiv RPC**. This wallet currently needs free test GLM from the [official faucet](https://hub.arkiv.network/faucet); never share a recovery phrase or private key.

---

## 📚 Complete Project Documentation

- [`arkiv/schema.md`](./arkiv/schema.md): Complete Arkiv entity definitions, typed attributes, and 7 SDK reproduction queries.
- [`arkiv/friction.md`](./arkiv/friction.md): Detailed developer friction report with 5 concrete recommendations for the Arkiv core team.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Deep-dive into state synchronization, offline cache design, and Arkiv integration.
- [`docs/PRIVACY_BOUNDARY.md`](./docs/PRIVACY_BOUNDARY.md): Strict Zero-PII boundary, spatial coarsening, and DPDP-aligned data minimization.
- [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md): 155-second timed video demo walkthrough script with visual cues.
- [`docs/DEVFOLIO_SUBMISSION.md`](./docs/DEVFOLIO_SUBMISSION.md): Complete answers for all 18 Devfolio submission questions.
- [`docs/SUBMISSION_CHECKLIST.md`](./docs/SUBMISSION_CHECKLIST.md): Verification matrix mapped to official hackathon evaluation criteria.
- [`docs/LIVE_TIRAMISU_EVIDENCE.md`](./docs/LIVE_TIRAMISU_EVIDENCE.md): Raw on-chain verification receipts, explorer queries, and block numbers.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) — open and free for municipal, civic, and humanitarian use.
