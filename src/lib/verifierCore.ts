import { PROJECT_ID, PuneZoneEnum, ResourceTypeEnum, AvailabilityStatusEnum, AttestationVerdictEnum, IncidentTypeEnum } from "../types/schema";

export interface VerificationStatuses {
  rpcReachable: boolean;
  chainIdVerified: boolean;
  projectQuerySuccessful: boolean;
  projectEntitiesValidated: boolean;
}

export interface ValidatedReliefPoint {
  key: string;
  creator: string;
  owner: string;
  createdAt: string;
  expiresAt: string;
  zone: string;
  resourceType: string;
  city: string;
  geohash5: string;
}

export interface ValidatedObservation {
  key: string;
  creator: string;
  reliefPointKey: string;
  status: string;
  severity: number;
  createdAt: string;
  expiresAt: string;
}

export interface ValidatedAttestation {
  key: string;
  creator: string;
  reliefPointKey: string;
  observationKey: string;
  verdict: string;
  createdAt: string;
  expiresAt: string;
}

export interface ValidatedIncident {
  key: string;
  creator: string;
  zone: string;
  incidentType: string;
  severity: number;
  resolved: number;
  createdAt: string;
  expiresAt: string;
}

export interface ValidatedEntitiesReport {
  reliefPoints: ValidatedReliefPoint[];
  observations: ValidatedObservation[];
  attestations: ValidatedAttestation[];
  incidents: ValidatedIncident[];
}

export interface ValidationSuccess {
  ok: true;
  entities: ValidatedEntitiesReport;
  summary: string;
}

export interface ValidationFailure {
  ok: false;
  error: string;
  code:
    | "EMPTY_RESULT"
    | "MISSING_ATTRIBUTES"
    | "WRONG_PROJECT_ID"
    | "MISSING_ENTITY_TYPES"
    | "BROKEN_REFERENCES"
    | "INVALID_CREATOR"
    | "INVALID_EXPIRY"
    | "INVALID_SCHEMA";
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

const VALID_ZONES = new Set(PuneZoneEnum.options.filter((z) => z !== "all"));
const VALID_RESOURCES = new Set(ResourceTypeEnum.options);
const VALID_STATUSES = new Set(AvailabilityStatusEnum.options);
const VALID_VERDICTS = new Set(AttestationVerdictEnum.options);
const VALID_INCIDENTS = new Set(IncidentTypeEnum.options);
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function validateOnchainEntities(rawEntities: any[]): ValidationResult {
  if (!Array.isArray(rawEntities) || rawEntities.length === 0) {
    return {
      ok: false,
      error: `Zero on-chain entities found for project '${PROJECT_ID}'.`,
      code: "EMPTY_RESULT",
    };
  }

  const reliefPoints: ValidatedReliefPoint[] = [];
  const observations: ValidatedObservation[] = [];
  const attestations: ValidatedAttestation[] = [];
  const incidents: ValidatedIncident[] = [];

  for (let i = 0; i < rawEntities.length; i++) {
    const entity = rawEntities[i];
    const key = String(entity?.key || "");

    if (!key.startsWith("0x")) {
      return {
        ok: false,
        error: `Entity at index ${i} has invalid key format: ${key}`,
        code: "INVALID_SCHEMA",
      };
    }

    // Must have attributes
    if (!entity.attributes || typeof entity.attributes !== "object") {
      return {
        ok: false,
        error: `Entity ${key} is missing required attributes object. select() query must include attributes: true.`,
        code: "MISSING_ATTRIBUTES",
      };
    }

    const attrs = entity.attributes as Record<string, { value: any }>;
    const projId = attrs?.project_id?.value;

    if (projId !== PROJECT_ID) {
      return {
        ok: false,
        error: `Entity ${key} has mismatched project_id '${projId}' (expected '${PROJECT_ID}').`,
        code: "WRONG_PROJECT_ID",
      };
    }

    // Validate creator provenance
    const creator = String(entity.creator || entity.owner || "");
    if (!ETH_ADDRESS_REGEX.test(creator)) {
      return {
        ok: false,
        error: `Entity ${key} has invalid creator/owner address '${creator}'.`,
        code: "INVALID_CREATOR",
      };
    }

    // Validate timestamps & expiry
    const createdAtBig = typeof entity.createdAt === "bigint" ? entity.createdAt : BigInt(entity.createdAt ?? 0);
    const expiresAtBig = typeof entity.expiresAt === "bigint" ? entity.expiresAt : BigInt(entity.expiresAt ?? 0);

    if (expiresAtBig <= createdAtBig && expiresAtBig !== 0n) {
      return {
        ok: false,
        error: `Entity ${key} has invalid expiration: expiresAt (${expiresAtBig}) must be greater than createdAt (${createdAtBig}).`,
        code: "INVALID_EXPIRY",
      };
    }

    const entityType = attrs?.entity_type?.value;
    if (!entityType) {
      return {
        ok: false,
        error: `Entity ${key} lacks an entity_type attribute.`,
        code: "INVALID_SCHEMA",
      };
    }

    if (entityType === "relief_point") {
      const zone = attrs?.zone?.value;
      const resourceType = attrs?.resource_type?.value;
      const city = attrs?.city?.value;
      const geohash5 = attrs?.geohash5?.value;

      if (!VALID_ZONES.has(zone)) {
        return {
          ok: false,
          error: `Relief point ${key} has invalid zone '${zone}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (!VALID_RESOURCES.has(resourceType)) {
        return {
          ok: false,
          error: `Relief point ${key} has invalid resource_type '${resourceType}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (city !== "pune") {
        return {
          ok: false,
          error: `Relief point ${key} has invalid city '${city}' (expected 'pune').`,
          code: "INVALID_SCHEMA",
        };
      }

      reliefPoints.push({
        key,
        creator,
        owner: String(entity.owner || creator),
        createdAt: createdAtBig.toString(),
        expiresAt: expiresAtBig.toString(),
        zone,
        resourceType,
        city,
        geohash5: String(geohash5 || ""),
      });
    } else if (entityType === "availability_observation") {
      const reliefPointKey = attrs?.relief_point_key?.value;
      const status = attrs?.status?.value;
      const severity = Number(attrs?.severity?.value);

      if (!reliefPointKey || typeof reliefPointKey !== "string" || !reliefPointKey.startsWith("0x")) {
        return {
          ok: false,
          error: `Observation ${key} has invalid relief_point_key '${reliefPointKey}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (!VALID_STATUSES.has(status)) {
        return {
          ok: false,
          error: `Observation ${key} has invalid status '${status}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (isNaN(severity) || severity < 1 || severity > 5) {
        return {
          ok: false,
          error: `Observation ${key} has invalid severity '${severity}' (must be 1..5).`,
          code: "INVALID_SCHEMA",
        };
      }

      observations.push({
        key,
        creator,
        reliefPointKey,
        status,
        severity,
        createdAt: createdAtBig.toString(),
        expiresAt: expiresAtBig.toString(),
      });
    } else if (entityType === "attestation") {
      const reliefPointKey = attrs?.relief_point_key?.value;
      const observationKey = attrs?.observation_key?.value;
      const verdict = attrs?.verdict?.value;

      if (!reliefPointKey || typeof reliefPointKey !== "string" || !reliefPointKey.startsWith("0x")) {
        return {
          ok: false,
          error: `Attestation ${key} has invalid relief_point_key '${reliefPointKey}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (!observationKey || typeof observationKey !== "string" || !observationKey.startsWith("0x")) {
        return {
          ok: false,
          error: `Attestation ${key} has invalid observation_key '${observationKey}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (!VALID_VERDICTS.has(verdict)) {
        return {
          ok: false,
          error: `Attestation ${key} has invalid verdict '${verdict}'.`,
          code: "INVALID_SCHEMA",
        };
      }

      attestations.push({
        key,
        creator,
        reliefPointKey,
        observationKey,
        verdict,
        createdAt: createdAtBig.toString(),
        expiresAt: expiresAtBig.toString(),
      });
    } else if (entityType === "incident") {
      const zone = attrs?.zone?.value;
      const incidentType = attrs?.incident_type?.value;
      const severity = Number(attrs?.severity?.value);
      const resolved = Number(attrs?.resolved?.value ?? 0);

      if (!VALID_ZONES.has(zone)) {
        return {
          ok: false,
          error: `Incident ${key} has invalid zone '${zone}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (!VALID_INCIDENTS.has(incidentType)) {
        return {
          ok: false,
          error: `Incident ${key} has invalid incident_type '${incidentType}'.`,
          code: "INVALID_SCHEMA",
        };
      }
      if (isNaN(severity) || severity < 1 || severity > 5) {
        return {
          ok: false,
          error: `Incident ${key} has invalid severity '${severity}'.`,
          code: "INVALID_SCHEMA",
        };
      }

      incidents.push({
        key,
        creator,
        zone,
        incidentType,
        severity,
        resolved,
        createdAt: createdAtBig.toString(),
        expiresAt: expiresAtBig.toString(),
      });
    } else {
      return {
        ok: false,
        error: `Entity ${key} has unhandled entity_type '${entityType}'.`,
        code: "INVALID_SCHEMA",
      };
    }
  }

  // Enforce ALL required entity types must be present
  if (reliefPoints.length === 0) {
    return {
      ok: false,
      error: "Missing required entity type: at least one 'relief_point' must exist.",
      code: "MISSING_ENTITY_TYPES",
    };
  }
  if (observations.length === 0) {
    return {
      ok: false,
      error: "Missing required entity type: at least one 'availability_observation' must exist.",
      code: "MISSING_ENTITY_TYPES",
    };
  }
  if (attestations.length === 0) {
    return {
      ok: false,
      error: "Missing required entity type: at least one 'attestation' must exist.",
      code: "MISSING_ENTITY_TYPES",
    };
  }
  if (incidents.length === 0) {
    return {
      ok: false,
      error: "Missing required entity type: at least one 'incident' must exist.",
      code: "MISSING_ENTITY_TYPES",
    };
  }

  // Cross-entity reference validation
  const reliefPointKeySet = new Set(reliefPoints.map((p) => p.key.toLowerCase()));
  for (const obs of observations) {
    if (!reliefPointKeySet.has(obs.reliefPointKey.toLowerCase())) {
      return {
        ok: false,
        error: `Observation ${obs.key} references non-existent relief_point_key '${obs.reliefPointKey}'.`,
        code: "BROKEN_REFERENCES",
      };
    }
  }

  const observationKeySet = new Set(observations.map((o) => o.key.toLowerCase()));
  for (const att of attestations) {
    if (!reliefPointKeySet.has(att.reliefPointKey.toLowerCase())) {
      return {
        ok: false,
        error: `Attestation ${att.key} references non-existent relief_point_key '${att.reliefPointKey}'.`,
        code: "BROKEN_REFERENCES",
      };
    }
    if (!observationKeySet.has(att.observationKey.toLowerCase())) {
      return {
        ok: false,
        error: `Attestation ${att.key} references non-existent observation_key '${att.observationKey}'.`,
        code: "BROKEN_REFERENCES",
      };
    }
  }

  return {
    ok: true,
    entities: {
      reliefPoints,
      observations,
      attestations,
      incidents,
    },
    summary: `Validated ${reliefPoints.length} relief_points, ${observations.length} observations, ${attestations.length} attestations, and ${incidents.length} incidents with consistent relational integrity.`,
  };
}
