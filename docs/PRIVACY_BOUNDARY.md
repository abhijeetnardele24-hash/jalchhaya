# JalChhaya Privacy Boundary & Zero-PII Policy

**Project**: JalChhaya (जलछाया)  
**Classification**: Public Municipal Infrastructure Data  
**Governing Principle**: Strict Zero-PII (Personally Identifiable Information) on Immutable Ledgers  
**Author**: Abhijeet Nardele  
**Date**: October 18, 2026  

---

## 1. Why Privacy is Critical for Indian Outdoor Gig Workers

In Indian urban centers like Pune, over 200,000 gig delivery partners (Swiggy, Zomato, Blinkit, Dunzo), auto-rickshaw drivers, and street hawkers navigate extreme heat. When workers report on-the-ground facility statuses (e.g. "Deccan water dispenser broken" or "Swargate shade tent crowded"), publishing personal information to a public blockchain would expose them to:
1. **Employer or Platform Surveillance**: Delivery platforms tracking workers' rest breaks or penalized dwell times.
2. **Personal Tracking & Harassment**: Associating personal phone numbers or home addresses with on-chain records.
3. **Data Harvesting**: Commercial data brokers aggregating mobility patterns.

**JalChhaya strictly prohibits any personal identification on the Arkiv Network.**

---

## 2. Hard Privacy Boundaries

| Category | Allowed on Arkiv Tiramisu | Strictly Prohibited (Rejected by Schema) |
|---|---|---|
| **Identity** | Cryptographic Pseudonym (`$creator` EVM address) | Full names, nicknames, Aadhaar numbers, employee IDs |
| **Contact** | None | Mobile numbers, WhatsApp handles, email addresses |
| **Location** | Well-known public landmarks (`address_hint`) & 5-char geohashes (`te7u2`) | Exact house/flat numbers, private residential coordinates, GPS breadcrumbs |
| **Vehicles** | None | Auto-rickshaw permit numbers, two-wheeler license plates |
| **Observations** | Facility metrics (water flow, chilled/warm, queue depth) | Personal worker comments, photos containing identifiable faces |

---

## 3. Technical Privacy Enforcement Mechanisms

### A. Client-Side Schema Validation via Zod
Before any payload is serialized and passed to `walletClient.createEntity()`, it is validated through Zod schemas in `src/types/schema.ts`. Any payload attempting to inject unauthorized keys is rejected client-side before any signature request:

```typescript
export const AvailabilityObservationPayloadSchema = z.object({
  queue_depth_estimate: z.string().max(64),
  water_temperature: z.string().max(64).optional(),
  observation_note: z.string().max(256),
  synthetic_demo: z.boolean(),
});
```

### B. Landmark-Based Spatial Referencing
Rather than storing precise meter-level GPS pins of individual citizens, JalChhaya uses:
1. **Pune Municipal Zones**: 8 recognized municipal administrative zones (`shivajinagar`, `deccan`, `swargate`, `hadapsar`, `kothrud`, `hinjawadi`, `katraj`, `yerawada`).
2. **Geohash-5 Precision**: Geohashes are capped at 5 characters (~4.9 km x 4.9 km bounding box, e.g. `te7u2`), sufficient for district-level aggregation without revealing high-resolution movement tracks.
3. **Public Transit Landmarks**: Addresses reference public landmarks (e.g., "Opposite Platform 3, Deccan Gymkhana Bus Terminal", "Near Jedhe Flyover Pillar 14").

### C. Automated Data Expiration as a Privacy Safeguard
Because Arkiv natively supports automated entity expiration via `ExpirationTime`:
- Real-time availability observations automatically expire and are purged from active state within **1 to 4 hours**.
- There is **no permanent historical record** of which worker visited which water station across Pune days or weeks later.
- Workers' daily routines cannot be reconstructed from stale on-chain historical state.

---

## 4. User Interface Privacy Warnings

The JalChhaya UI displays explicit privacy warnings above every submission form:

> **Notice**: *"This report will be written to the public Arkiv testnet. Do NOT enter private names, phone numbers, or personal details."*

Forms provide guided buttons (e.g. "Confirmed Usable", "High Wait Time / Crowded", "Out of Service / Dry") and bounded selectors to minimize free-form text input and eliminate accidental PII disclosure.

---

## 5. Compliance with Digital Personal Data Protection (DPDP) Act, 2023

JalChhaya is designed to comply with the principles of India's Digital Personal Data Protection Act, 2023:
1. **Purpose Limitation**: Data collected is strictly limited to municipal facility availability and water infrastructure health.
2. **Data Minimization**: Only facility status and queue metrics are collected.
3. **Storage Limitation**: Enforced protocol-level data expiry via Arkiv's native storage lifecycle.
4. **No Profiling**: No individual worker profiling or behavioral analytics exist in the protocol.
