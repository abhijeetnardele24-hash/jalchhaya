# JalChhaya (जलछाया) — Verifiable Extreme-Heat Relief Network

> **A verifiable public availability network for drinking-water, shade, cooling, and first-aid points during extreme heat waves in Indian cities, powered authoritatively by Arkiv on Tiramisu testnet.**

Built for **Arkiv Global Tour Stop (Pre-Devcon)** | Track: **Best Indian Use Case** ($2,000 USDC + Devcon 8 Ticket)  
Secondary Track Alignment: **Security / Censorship Resistance**  
License: **MIT License** | Author: **Abhijeet Nardele (India)**  

---

## ☀️ The Core Problem in India

India's Ministry of Health and Family Welfare (MoHFW) and National Centre for Disease Control (NCDC) heat preparedness guidelines emphasize that outdoor workers—delivery riders (Swiggy, Zomato, Dunzo), street vendors, construction workers, and transit commuters—face acute heat-stress risks during peak summer and unseasonal heatwaves.

Existing tools provide static directory listings or city-wide weather warnings. What is missing on the ground is a **tamper-evident, live answer to three critical questions**:
1. **Is this specific relief point (water kiosk / cooling station / shade shelter) actually functional right now?**
2. **Who confirmed it, and can their authorship be cryptographically verified?**
3. **When does this evidence expire, preventing stale data from misleading someone in physical distress?**

---

## 🏛️ Why Arkiv is Non-Negotiable

- **Postgres / Centralized Web2 API**: A municipal contractor or platform operator can censor, modify, or erase outage reports to preserve appearances.
- **IPFS**: Immutable content addressing, but lacks native compound queries (`city` + `zone` + `status` + `severity` + `resource_type`) and cannot purge stale records from the active query set automatically.
- **Subgraph**: Requires an external blockchain indexing layer with significant latency and high gas overhead.
- **Arkiv Network**: Provides database-grade typed attributes, compound multi-predicate queries, immutable `$creator` provenance, wallet-owned `$owner` permissions, native **Entity Expiration** (preventing stale relief claims), **Lifetime Extension** (community renewal leases), and real-time WebSocket subscriptions (`watchEntityEvents`) without polling.

---

## 📊 Comprehensive Test & Quality Verification

| Test Suite | Scope | Target | Result | Status |
|---|---|---|---|---|
| **Unit Coverage (Vitest)** | 33 tests across App, components, SDK service, schemas | >85% | **97.53% Statements, 94.82% Functions, 90.48% Branches** | **PASS** |
| **Accessibility (Playwright Axe)** | WCAG 2.2 AA Automated Scan | 0 violations | **0 Critical / 0 Serious / 0 Moderate Violations** | **PASS** |
| **Cross-Viewport Responsiveness** | 320px, 390px, 768px, 1024px, 1440px, 1920px | Zero overflow | **24/24 Playwright Tests Passing** | **PASS** |
| **TypeScript Typecheck** | `tsc --noEmit` | 0 errors | **0 Errors** | **PASS** |
| **Production Build** | `vite build` | Clean bundle | **Built in 2.77s** | **PASS** |
| **Secret Scanning** | Git tracked tree | 0 private keys | **Zero credentials or secrets staged** | **PASS** |

---

## 📦 Architecture & Verified Contracts

- **Network:** Arkiv Tiramisu Testnet (Chain ID `7738577`)
- **Data Layer:** `@arkiv-network/sdk` 0.8.1 + `viem` 2.21.32
- **Frontend:** React 18 + Vite + TypeScript PWA (Mobile-first, Multilingual English / Marathi / Hindi)
- **Authoritative Entity Contracts**:
  1. `relief_point`: Long-lived facility registry (180 days, permissionless lifetime extension).
  2. `availability_observation`: Dynamic ground status (1–4 hours automated expiration).
  3. `attestation`: Independent confirm/challenge peer reviews with `$creator` cryptographic provenance.
  4. `incident`: Emergency municipal heat warnings and facility outages (12–24 hours).

---

## 📑 Complete Documentation Directory

| Document | Description |
|---|---|
| [`/arkiv/schema.md`](./arkiv/schema.md) | Full Arkiv entity schemas, typed attribute definitions, and 7 SDK queries |
| [`/arkiv/friction.md`](./arkiv/friction.md) | In-depth Developer Experience Friction Report with 5 actionable recommendations |
| [`/docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System overview, entity lifecycle, Arkiv integration, and state synchronization |
| [`/docs/PRIVACY_BOUNDARY.md`](./docs/PRIVACY_BOUNDARY.md) | Strict Zero-PII boundary, spatial coarsening, and Indian DPDP Act compliance |
| [`/docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) | 155-second timed video presentation walkthrough with visual cues |
| [`/docs/DEVFOLIO_SUBMISSION.md`](./docs/DEVFOLIO_SUBMISSION.md) | Comprehensive answers for all 18 Devfolio submission questions |
| [`/docs/SUBMISSION_CHECKLIST.md`](./docs/SUBMISSION_CHECKLIST.md) | Complete verification matrix against hackathon judging criteria |
| [`/docs/LIVE_TIRAMISU_EVIDENCE.md`](./docs/LIVE_TIRAMISU_EVIDENCE.md) | Live block height (`#731547`), explorer links, and RPC query proof |

---

## 🚀 Quickstart & Reproduction

```bash
# 1. Clone repository
git clone https://github.com/abhijeetnardele24-hash/jalchhaya.git
cd jalchhaya

# 2. Install dependencies
npm install

# 3. Run typecheck & unit tests with coverage
npm run typecheck
npm test

# 4. Run end-to-end accessibility & viewport tests
npm run test:e2e

# 5. Verify live Arkiv Tiramisu on-chain connection
npm run verify-onchain

# 6. Run local development server
npm run dev
```

---

## 🌐 Live Testnet Details

- **RPC URL**: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`
- **WebSocket URL**: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`
- **Chain ID**: `7738577`
- **Currency**: `GLM`
- **Explorer**: `https://tiramisu.explorer.arkiv.network`
- **Faucet**: `https://hub.arkiv.network/faucet`
- **Dedicated Deployer Wallet**: `0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279`
