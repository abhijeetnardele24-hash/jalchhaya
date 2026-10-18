# Arkiv Entity Schema Specification — JalChhaya (जलछाया)

> **Challenge:** Arkiv Global Tour Stop (Pre-Devcon)  
> **Network:** Arkiv Tiramisu Testnet (`7738577`)  
> **Package:** `@arkiv-network/sdk` 0.8.x + `viem`  
> **Project Identifier:** `project_id = "jalchhaya-pune-2026"`

---

## 1. Architectural Philosophy: Attributes vs. Payload

In Arkiv, **attributes** are indexed, typed columns consumed by the query engine (`select().where(...)`). The **payload** is raw application data (up to 128 KiB) that is stored and returned, but not queryable.

JalChhaya strictly separates these concerns:
- **Attributes hold ONLY query parameters and security predicates:** location hierarchy (`city`, `zone`), categorization (`resource_type`, `entity_type`), operational status (`status`, `verdict`), numeric ranges (`severity`, `observed_at`), and cryptographic links (`relief_point_key`, `observation_key`).
- **Payload holds human-facing display detail:** facility labels, landmark directions, amenity inventories, notes, and local language metadata.
- **Privacy Enforcement:** No personal identifiers (names, phones, IP addresses, exact geolocation coordinates) are EVER placed in attributes or payloads.

---

## 2. Entity Contracts

### 2.1 `relief_point`
- **Purpose:** Stable, discoverable directory entity representing a synthetic public heat-relief facility (drinking-water kiosk, shaded shelter, cooling centre, ORS distribution booth).
- **Expiration Policy:** 30 days (`ExpirationTime.fromDays(30)`).
- **Creation Flags:** `{ permissionlessExtension: true }` — allows outdoor workers and community stewards to renew the relief point's lifetime as long as it remains active.

#### Attributes Schema
| Attribute Name | Type Tag | SDK Helper | Description / Allowed Values |
|---|---|---|---|
| `project_id` | `str` | `str("jalchhaya-pune-2026")` | Global project partition tag |
| `entity_type` | `str` | `str("relief_point")` | Discriminator tag |
| `city` | `str` | `str("pune")` | Target municipality |
| `zone` | `str` | `str("shivajinagar" \| "deccan" \| "swargate" \| "hadapsar" \| "kothrud" \| "hinjawadi" \| "katraj" \| "yerawada")` | Administrative zone |
| `geohash5` | `str` | `str("te7u8")` | Coarse 5-character geohash (~4.9 km² cell) |
| `resource_type` | `str` | `str("water" \| "shade" \| "cooling_centre" \| "first_aid_ors")` | Type of relief infrastructure |
| `accessibility` | `str` | `str("wheelchair_accessible" \| "standard")` | Physical accessibility rating |
| `operator_class` | `str` | `str("municipal" \| "community_trust" \| "transit_hub" \| "merchant_association")` | Operating body class |

#### Payload Schema (`application/json`)
```json
{
  "name": "Deccan PMT Bus Terminal Water Kiosk",
  "name_mr": "डेक्कन पीएमटी बस स्थानक पाणपोई",
  "name_hi": "डेक्कन पीएमटी बस स्टैंड जल सेवा",
  "address_hint": "Adjacent to Platform 2 shelter, Deccan Gymkhana",
  "amenities": ["chilled_potable_water", "covered_seating", "ors_packets_available"],
  "operating_hours": "07:00 - 21:00 IST",
  "synthetic_demo": true
}
```

---

### 2.2 `availability_observation`
- **Purpose:** Short-lived on-chain status report submitted by a registered field volunteer, delivery rider, or outdoor commuter documenting real-time facility usability.
- **Expiration Policy:**
  - `status == "available"`: 2 hours (`ExpirationTime.fromHours(2)`).
  - `status == "crowded"`: 2 hours (`ExpirationTime.fromHours(2)`).
  - `status == "unavailable"`: 4 hours (`ExpirationTime.fromHours(4)`).
  *Rationale:* Outages require longer visibility so travelers do not divert to broken stations, while confirmations require frequent fresh heartbeats.

#### Attributes Schema
| Attribute Name | Type Tag | SDK Helper | Description / Allowed Values |
|---|---|---|---|
| `project_id` | `str` | `str("jalchhaya-pune-2026")` | Project partition tag |
| `entity_type` | `str` | `str("availability_observation")` | Discriminator tag |
| `relief_point_key` | `key` | `key(pointEntityKey)` | 32-byte Arkiv entity key referencing the `relief_point` |
| `city` | `str` | `str("pune")` | Target municipality |
| `zone` | `str` | `str("deccan")` | Coarse zone |
| `resource_type` | `str` | `str("water")` | Denormalized for compound querying |
| `status` | `str` | `str("available" \| "crowded" \| "unavailable")` | Usability state |
| `severity` | `i32` | `i32(1 \| 2 \| 3 \| 4 \| 5)` | 1 = normal, 3 = long queue, 5 = zero water/broken |
| `observed_at` | `u64` | `u64(timestampSeconds)` | Unix timestamp in seconds |

#### Payload Schema (`application/json`)
```json
{
  "queue_depth_estimate": "5-10 people",
  "water_temperature": "chilled",
  "observation_note": "Filter dispenser operational, tap 2 under maintenance",
  "synthetic_demo": true
}
```

---

### 2.3 `attestation`
- **Purpose:** Independent confirmation or challenge submitted by a second independent wallet to verify or dispute a published observation.
- **Expiration Policy:** 4 hours (`ExpirationTime.fromHours(4)`).
- **Security Rule:** Grouped and attributed client-side by immutable `$creator`. A user cannot forge their reporter identity because `$creator` is assigned by the protocol from the Ethereum transaction signature.

#### Attributes Schema
| Attribute Name | Type Tag | SDK Helper | Description / Allowed Values |
|---|---|---|---|
| `project_id` | `str` | `str("jalchhaya-pune-2026")` | Project partition tag |
| `entity_type` | `str` | `str("attestation")` | Discriminator tag |
| `relief_point_key` | `key` | `key(pointEntityKey)` | 32-byte key referencing the facility |
| `observation_key` | `key` | `key(obsEntityKey)` | 32-byte key referencing the observation |
| `verdict` | `str` | `str("confirm" \| "challenge")` | Affirmation or contradiction |
| `observed_at` | `u64` | `u64(timestampSeconds)` | Unix timestamp in seconds |

#### Payload Schema (`application/json`)
```json
{
  "reason": "verified_usable",
  "note": "Filled 2 bottles at 13:15, good flow and cold water",
  "synthetic_demo": true
}
```

---

### 2.4 `incident`
- **Purpose:** Critical emergency alert for severe heat-stress conditions or major relief outages (e.g., water tanker delay in 43°C heat, power outage at cooling centre).
- **Expiration Policy:** 6 hours (`ExpirationTime.fromHours(6)`). Extendable via `extendEntity` if a fresh observation supports continuation.

#### Attributes Schema
| Attribute Name | Type Tag | SDK Helper | Description / Allowed Values |
|---|---|---|---|
| `project_id` | `str` | `str("jalchhaya-pune-2026")` | Project partition tag |
| `entity_type` | `str` | `str("incident")` | Discriminator tag |
| `relief_point_key` | `key` | `key(pointEntityKey)` | Target facility key |
| `city` | `str` | `str("pune")` | Target municipality |
| `zone` | `str` | `str("hadapsar")` | Affected zone |
| `incident_type` | `str` | `str("water_outage" \| "power_failure" \| "extreme_crowding" \| "supply_exhausted")` | Incident classification |
| `severity` | `i32` | `i32(4 \| 5)` | High or critical |
| `opened_at` | `u64` | `u64(timestampSeconds)` | Unix timestamp in seconds |

#### Payload Schema (`application/json`)
```json
{
  "headline": "Municipal Tanker Refill Delayed — Reserve Tank at 5%",
  "action_guidance": "Delivery partners advised to route to Swargate Depot relief point",
  "synthetic_demo": true
}
```

---

## 3. Mandatory SDK Queries Demonstrated in JalChhaya

The application implements and executes these exact TypeScript queries against the Tiramisu testnet:

### Query 1: Active Relief Points in Zone with Compound Filtering
```typescript
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";

const points = await publicClient
  .select({
    key: true,
    owner: true,
    creator: true,
    createdAt: true,
    expiresAt: true,
    creationFlags: true,
    payload: true,
    attributes: true,
  })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    eq("entity_type", str("relief_point")),
    eq("city", str("pune")),
    eq("zone", str(selectedZone))
  )
  .limit(50)
  .fetch();
```

### Query 2: Active Unavailable Observations with Range Predicate on Severity
```typescript
import { str, i32 } from "@arkiv-network/sdk/attr";
import { eq, gte } from "@arkiv-network/sdk/query";

const severeOutages = await publicClient
  .select({ key: true, creator: true, expiresAt: true, payload: true, attributes: true })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    eq("entity_type", str("availability_observation")),
    eq("status", str("unavailable")),
    gte("severity", i32(3))
  )
  .limit(20)
  .fetch();
```

### Query 3: Attestations Grouped by Immutable Creator
```typescript
import { str, key } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";

const attestations = await publicClient
  .select({ key: true, creator: true, expiresAt: true, payload: true, attributes: true })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    eq("entity_type", str("attestation")),
    eq("observation_key", key(observationKey))
  )
  .fetch();
// Client-side grouping uses attestation.creator
```

### Query 4: Publisher Attributions via `createdBy`
```typescript
import { str } from "@arkiv-network/sdk/attr";
import { eq, createdBy } from "@arkiv-network/sdk/query";

const officialEntities = await publicClient
  .select({ key: true, expiresAt: true, payload: true, attributes: true })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    createdBy(officialPublisherAddress)
  )
  .limit(100)
  .fetch();
```

### Query 5: Cursor-Based Pagination
```typescript
const firstPage = await publicClient
  .select({ key: true, payload: true, attributes: true })
  .where(eq("project_id", str("jalchhaya-pune-2026")))
  .limit(10)
  .fetch();

if (firstPage.cursor) {
  const secondPage = await publicClient
    .select({ key: true, payload: true, attributes: true })
    .where(eq("project_id", str("jalchhaya-pune-2026")))
    .limit(10)
    .cursor(firstPage.cursor)
    .fetch();
}
```

### Query 6: Entities Nearing Expiration Range Query
```typescript
import { str } from "@arkiv-network/sdk/attr";
import { eq, lte } from "@arkiv-network/sdk/query";

// Expiration block range check
const soonExpiring = await publicClient
  .select({ key: true, expiresAt: true, attributes: true })
  .where(
    eq("project_id", str("jalchhaya-pune-2026")),
    lte("$expiresAt", currentBlock + 1800n) // ~1 hour window
  )
  .fetch();
```

### Query 7: Real-Time WebSocket Event Stream
```typescript
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { webSocket } from "viem";

const wsClient = createPublicClient({
  chain: tiramisu,
  transport: webSocket("wss://rpc.tiramisu.db-chain.testnet.arkiv.network"),
});

const unwatch = wsClient.watchEntityEvents({
  onEntityCreated: (event) => handleIncomingEntity(event.entityKey),
  onEntityPatched: (event) => refreshEntity(event.entityKey),
  onExpiryExtended: (event) => updateEntityExpiry(event.entityKey),
  onError: (err) => console.warn("Arkiv WS stream notice:", err),
});
```
