import { describe, it, expect } from "vitest";
import { validateOnchainEntities } from "../../src/lib/verifierCore";
import { PROJECT_ID } from "../../src/types/schema";

describe("Strict On-Chain Verifier Engine (validateOnchainEntities)", () => {
  const validCreator = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279";
  const validAttester = "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471";
  const pointKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const obsKey = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const attKey = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
  const incKey = "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";

  const createValidMockEntities = (): any[] => [
    {
      key: pointKey,
      creator: validCreator,
      owner: validCreator,
      createdAt: 1000n,
      expiresAt: 5000n,
      attributes: {
        project_id: { value: PROJECT_ID },
        entity_type: { value: "relief_point" },
        city: { value: "pune" },
        zone: { value: "deccan" },
        resource_type: { value: "water" },
        accessibility: { value: "wheelchair_accessible" },
        operator_class: { value: "transit_hub" },
        geohash5: { value: "te7u8" },
      },
    },
    {
      key: obsKey,
      creator: validCreator,
      owner: validCreator,
      createdAt: 1100n,
      expiresAt: 2000n,
      attributes: {
        project_id: { value: PROJECT_ID },
        entity_type: { value: "availability_observation" },
        relief_point_key: { value: pointKey },
        status: { value: "available" },
        severity: { value: 1 },
        zone: { value: "deccan" },
        resource_type: { value: "water" },
      },
    },
    {
      key: attKey,
      creator: validAttester,
      owner: validAttester,
      createdAt: 1200n,
      expiresAt: 2500n,
      attributes: {
        project_id: { value: PROJECT_ID },
        entity_type: { value: "attestation" },
        relief_point_key: { value: pointKey },
        observation_key: { value: obsKey },
        verdict: { value: "confirm" },
      },
    },
    {
      key: incKey,
      creator: validCreator,
      owner: validCreator,
      createdAt: 1050n,
      expiresAt: 3000n,
      attributes: {
        project_id: { value: PROJECT_ID },
        entity_type: { value: "incident" },
        zone: { value: "deccan" },
        incident_type: { value: "water_outage" },
        severity: { value: 3 },
        resolved: { value: 0 },
      },
    },
  ];

  it("fails verification on empty or non-array entity list", () => {
    const res1 = validateOnchainEntities([]);
    expect(res1.ok).toBe(false);
    if (!res1.ok) {
      expect(res1.code).toBe("EMPTY_RESULT");
      expect(res1.error).toContain("Zero on-chain entities found");
    }

    const res2 = validateOnchainEntities(null as any);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.code).toBe("EMPTY_RESULT");
    }
  });

  it("fails verification when entity is missing attributes object (select omits attributes:true)", () => {
    const entities = [
      {
        key: pointKey,
        creator: validCreator,
        // attributes omitted
      },
    ];
    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("MISSING_ATTRIBUTES");
      expect(res.error).toContain("missing required attributes object");
    }
  });

  it("fails verification when entity has wrong project_id", () => {
    const entities = createValidMockEntities();
    entities[0].attributes.project_id.value = "stale-or-wrong-id";

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("WRONG_PROJECT_ID");
      expect(res.error).toContain("stale-or-wrong-id");
    }
  });

  it("fails verification when entity has invalid creator address", () => {
    const entities = createValidMockEntities();
    entities[0].creator = "not-an-eth-address";

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_CREATOR");
      expect(res.error).toContain("invalid creator/owner address");
    }
  });

  it("fails verification when entity has invalid expiration (expiresAt <= createdAt)", () => {
    const entities = createValidMockEntities();
    entities[0].expiresAt = 500n; // less than createdAt: 1000n

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_EXPIRY");
      expect(res.error).toContain("invalid expiration");
    }
  });

  it("fails verification when required entity types are missing", () => {
    // Only relief points present, missing observations, attestations, incidents
    const entities = [createValidMockEntities()[0]];
    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("MISSING_ENTITY_TYPES");
      expect(res.error).toContain("Missing required entity type");
    }
  });

  it("fails verification on broken observation reference (non-existent relief_point_key)", () => {
    const entities = createValidMockEntities();
    entities[1].attributes.relief_point_key.value = "0x9999999999999999999999999999999999999999999999999999999999999999";

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("BROKEN_REFERENCES");
      expect(res.error).toContain("references non-existent relief_point_key");
    }
  });

  it("fails verification on broken attestation reference (non-existent observation_key)", () => {
    const entities = createValidMockEntities();
    entities[2].attributes.observation_key.value = "0x8888888888888888888888888888888888888888888888888888888888888888";

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("BROKEN_REFERENCES");
      expect(res.error).toContain("references non-existent observation_key");
    }
  });

  it("fails verification on invalid schema attributes (invalid zone or status)", () => {
    const entities = createValidMockEntities();
    entities[0].attributes.zone.value = "invalid_zone_xyz";

    const res = validateOnchainEntities(entities);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_SCHEMA");
      expect(res.error).toContain("invalid zone");
    }
  });

  it("fails verification on invalid key, missing entity_type, or unknown entity_type", () => {
    const entities1 = createValidMockEntities();
    entities1[0].key = "invalid-key-no-hex";
    const res1 = validateOnchainEntities(entities1);
    expect(res1.ok).toBe(false);
    if (!res1.ok) {
      expect(res1.code).toBe("INVALID_SCHEMA");
      expect(res1.error).toContain("invalid key format");
    }

    const entities2 = createValidMockEntities();
    delete (entities2[0].attributes as any).entity_type;
    const res2 = validateOnchainEntities(entities2);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.code).toBe("INVALID_SCHEMA");
      expect(res2.error).toContain("lacks an entity_type");
    }

    const entities3 = createValidMockEntities();
    entities3[0].attributes.entity_type.value = "unknown_type_xyz";
    const res3 = validateOnchainEntities(entities3);
    expect(res3.ok).toBe(false);
    if (!res3.ok) {
      expect(res3.code).toBe("INVALID_SCHEMA");
      expect(res3.error).toContain("unhandled entity_type");
    }
  });

  it("fails verification on invalid resource_type or city for relief_point", () => {
    const entities1 = createValidMockEntities();
    entities1[0].attributes.resource_type.value = "invalid_resource";
    const res1 = validateOnchainEntities(entities1);
    expect(res1.ok).toBe(false);
    if (!res1.ok) {
      expect(res1.code).toBe("INVALID_SCHEMA");
      expect(res1.error).toContain("invalid resource_type");
    }

    const entities2 = createValidMockEntities();
    entities2[0].attributes.city.value = "mumbai";
    const res2 = validateOnchainEntities(entities2);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.code).toBe("INVALID_SCHEMA");
      expect(res2.error).toContain("invalid city");
    }
  });

  it("fails verification on invalid observation fields", () => {
    const entities1 = createValidMockEntities();
    entities1[1].attributes.relief_point_key.value = "not-hex";
    const res1 = validateOnchainEntities(entities1);
    expect(res1.ok).toBe(false);

    const entities2 = createValidMockEntities();
    entities2[1].attributes.status.value = "broken_status";
    const res2 = validateOnchainEntities(entities2);
    expect(res2.ok).toBe(false);

    const entities3 = createValidMockEntities();
    entities3[1].attributes.severity.value = 99;
    const res3 = validateOnchainEntities(entities3);
    expect(res3.ok).toBe(false);
  });

  it("fails verification on invalid attestation fields or attestation referencing non-existent relief_point", () => {
    const entities1 = createValidMockEntities();
    entities1[2].attributes.relief_point_key.value = "not-hex";
    const res1 = validateOnchainEntities(entities1);
    expect(res1.ok).toBe(false);

    const entities2 = createValidMockEntities();
    entities2[2].attributes.observation_key.value = "not-hex";
    const res2 = validateOnchainEntities(entities2);
    expect(res2.ok).toBe(false);

    const entities3 = createValidMockEntities();
    entities3[2].attributes.verdict.value = "invalid_verdict";
    const res3 = validateOnchainEntities(entities3);
    expect(res3.ok).toBe(false);

    const entities4 = createValidMockEntities();
    entities4[2].attributes.relief_point_key.value = "0x9999999999999999999999999999999999999999999999999999999999999999";
    const res4 = validateOnchainEntities(entities4);
    expect(res4.ok).toBe(false);
    if (!res4.ok) {
      expect(res4.code).toBe("BROKEN_REFERENCES");
    }
  });

  it("fails verification on invalid incident fields", () => {
    const entities1 = createValidMockEntities();
    entities1[3].attributes.zone.value = "invalid_zone";
    const res1 = validateOnchainEntities(entities1);
    expect(res1.ok).toBe(false);

    const entities2 = createValidMockEntities();
    entities2[3].attributes.incident_type.value = "invalid_incident";
    const res2 = validateOnchainEntities(entities2);
    expect(res2.ok).toBe(false);

    const entities3 = createValidMockEntities();
    entities3[3].attributes.severity.value = 0;
    const res3 = validateOnchainEntities(entities3);
    expect(res3.ok).toBe(false);
  });

  it("succeeds when all 4 entity types, attributes, creator provenance, and cross-entity references are valid", () => {
    const entities = createValidMockEntities();
    const res = validateOnchainEntities(entities);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.entities.reliefPoints.length).toBe(1);
      expect(res.entities.observations.length).toBe(1);
      expect(res.entities.attestations.length).toBe(1);
      expect(res.entities.incidents.length).toBe(1);
      expect(res.summary).toContain("Validated 1 relief_points, 1 observations, 1 attestations, and 1 incidents");
    }
  });
});
