# JalChhaya (जलछाया) — Verifiable Extreme-Heat Relief Network

> **A verifiable public availability network for drinking-water, shade, cooling, and first-aid points during extreme heat waves in Indian cities, powered authoritatively by Arkiv on Tiramisu testnet.**

Built for **Arkiv Global Tour Stop (Pre-Devcon)** | Track: **Best Indian Use Case**

---

## ☀️ The Core Problem in India

India's Ministry of Health and Family Welfare (MoHFW) and National Centre for Disease Control (NCDC) heat preparedness guidelines emphasize that outdoor workers—delivery riders, street vendors, construction workers, and transit commuters—face acute heat-stress risks during peak summer and unseasonal heatwaves.

Existing tools provide static directory listings or city-wide weather warnings. What is missing on the ground is a **tamper-evident, live answer to three critical questions**:
1. **Is this specific relief point (water kiosk / cooling station / shade shelter) actually functional right now?**
2. **Who confirmed it, and can their authorship be cryptographically verified?**
3. **When does this evidence expire, preventing stale data from misleading someone in physical distress?**

---

## 🏛️ Why Arkiv is Non-Negotiable

- **Postgres / Centralized API:** A municipal contractor or platform operator can censor, modify, or erase outage reports to preserve appearances.
- **IPFS:** Immutable content addressing, but lacks native compound queries (`city` + `zone` + `status` + `severity` + `resource_type`) and cannot purge stale records from the active query set automatically.
- **Subgraph:** Requires an external blockchain indexing layer with significant latency and high gas overhead.
- **Arkiv Network:** Provides database-grade typed attributes, compound multi-predicate queries, immutable `$creator` provenance, wallet-owned `$owner` permissions, native **Entity Expiration** (preventing stale relief claims), **Lifetime Extension** (community renewal leases), and real-time WebSocket subscriptions (`watchEntityEvents`) without polling.

---

## 📦 Architecture & Verified Contracts

- **Network:** Arkiv Tiramisu Testnet (Chain ID `7738577`)
- **Data Layer:** `@arkiv-network/sdk` 0.8.x + `viem`
- **Frontend:** React + Vite + TypeScript PWA (Mobile-first, Multilingual English / Hindi / Marathi)
- **Entity Schemas:** Defined in [`/arkiv/schema.md`](./arkiv/schema.md)
- **Friction Report:** Detailed in [`/arkiv/friction.md`](./arkiv/friction.md)
- **Licence:** MIT (see [`LICENSE`](./LICENSE))

---

## 🚀 Quickstart & Reproduction

```bash
# Clone repository
git clone https://github.com/abhijeetnardele24-hash/jalchhaya.git
cd jalchhaya

# Install dependencies
npm install

# Run typecheck and unit tests
npm run typecheck
npm test

# Run local development server
npm run dev
```
