import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
  jsonToPayload,
} from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { str, i32, u64, key as arkivKey } from "@arkiv-network/sdk/attr";
import { eq, gte } from "@arkiv-network/sdk/query";
import { http, custom, webSocket } from "viem";
import {
  ReliefPoint,
  AvailabilityObservation,
  Attestation,
  Incident,
  PROJECT_ID,
  PuneZone,
  AvailabilityStatus,
  ResourceType,
  AttestationVerdict,
} from "../types/schema";
import {
  INITIAL_SYNTHETIC_POINTS,
  INITIAL_SYNTHETIC_OBSERVATIONS,
  INITIAL_SYNTHETIC_ATTESTATIONS,
  INITIAL_SYNTHETIC_INCIDENTS,
} from "./mockData";

export const TIRAMISU_HTTP_RPC = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
export const TIRAMISU_WS_RPC = "wss://rpc.tiramisu.db-chain.testnet.arkiv.network";
export const TIRAMISU_EXPLORER = "https://tiramisu.explorer.arkiv.network";

// Public client for queries and reads (safe for browser)
export const arkivPublicClient = createPublicClient({
  chain: tiramisu,
  transport: http(TIRAMISU_HTTP_RPC),
});

// Cache / local state store to merge live Arkiv data with initial synthetic baseline
let localPoints: ReliefPoint[] = [...INITIAL_SYNTHETIC_POINTS];
let localObservations: AvailabilityObservation[] = [...INITIAL_SYNTHETIC_OBSERVATIONS];
let localAttestations: Attestation[] = [...INITIAL_SYNTHETIC_ATTESTATIONS];
let localIncidents: Incident[] = [...INITIAL_SYNTHETIC_INCIDENTS];

export async function fetchReliefPoints(zone: PuneZone = "all"): Promise<ReliefPoint[]> {
  try {
    const query = arkivPublicClient
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
        eq("project_id", str(PROJECT_ID)),
        eq("entity_type", str("relief_point"))
      );

    const result = await query.limit(50).fetch();

    if (result && result.entities && result.entities.length > 0) {
      const onchainPoints: ReliefPoint[] = result.entities.map((e) => {
        const payload = e.toJson() as ReliefPoint["payload"];
        const attrs = e.attributes as Record<string, { value: any }>;
        return {
          key: e.key as `0x${string}`,
          creator: (e.creator || e.owner) as `0x${string}`,
          owner: e.owner as `0x${string}`,
          createdAt: e.createdAt,
          expiresAt: e.expiresAt,
          creationFlags: e.creationFlags,
          projectId: attrs?.project_id?.value || PROJECT_ID,
          entityType: "relief_point",
          city: attrs?.city?.value || "pune",
          zone: (attrs?.zone?.value || "deccan") as PuneZone,
          geohash5: attrs?.geohash5?.value || "te7u8",
          resourceType: (attrs?.resource_type?.value || "water") as ResourceType,
          accessibility: attrs?.accessibility?.value || "standard",
          operatorClass: attrs?.operator_class?.value || "community_trust",
          payload,
        };
      });

      // Merge on-chain points with local defaults (on-chain overrides)
      const pointMap = new Map<string, ReliefPoint>();
      localPoints.forEach((p) => pointMap.set(p.key, p));
      onchainPoints.forEach((p) => pointMap.set(p.key, p));
      localPoints = Array.from(pointMap.values());
    }
  } catch (err) {
    console.warn("Arkiv testnet query notice (fallback to local state):", err);
  }

  // Attach latest observations and attestations
  const populated = localPoints.map((point) => {
    const pointObs = localObservations
      .filter((o) => o.reliefPointKey.toLowerCase() === point.key.toLowerCase())
      .sort((a, b) => b.observedAt - a.observedAt);

    const latestObservation = pointObs[0];
    const pointAttestations = latestObservation
      ? localAttestations.filter(
          (a) => a.observationKey.toLowerCase() === latestObservation.key.toLowerCase()
        )
      : [];

    return {
      ...point,
      latestObservation,
      attestations: pointAttestations,
    };
  });

  if (zone === "all") {
    return populated;
  }
  return populated.filter((p) => p.zone === zone);
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const result = await arkivPublicClient
      .select({
        key: true,
        creator: true,
        expiresAt: true,
        payload: true,
        attributes: true,
      })
      .where(
        eq("project_id", str(PROJECT_ID)),
        eq("entity_type", str("incident")),
        gte("severity", i32(3))
      )
      .limit(10)
      .fetch();

    if (result && result.entities && result.entities.length > 0) {
      const onchainIncidents: Incident[] = result.entities.map((e) => {
        const payload = e.toJson() as Incident["payload"];
        const attrs = e.attributes as Record<string, { value: any }>;
        return {
          key: e.key as `0x${string}`,
          creator: e.creator as `0x${string}`,
          expiresAt: e.expiresAt,
          projectId: attrs?.project_id?.value || PROJECT_ID,
          entityType: "incident",
          reliefPointKey: attrs?.relief_point_key?.value as `0x${string}`,
          city: attrs?.city?.value || "pune",
          zone: (attrs?.zone?.value || "hadapsar") as PuneZone,
          incidentType: attrs?.incident_type?.value || "extreme_crowding",
          severity: attrs?.severity?.value || 4,
          openedAt: attrs?.opened_at?.value || Math.floor(Date.now() / 1000),
          payload,
        };
      });
      return onchainIncidents;
    }
  } catch (err) {
    console.warn("Could not query on-chain incidents:", err);
  }
  return localIncidents;
}

export async function publishAvailabilityObservation(
  ethereumProvider: any,
  accountAddress: `0x${string}`,
  params: {
    reliefPointKey: `0x${string}`;
    zone: PuneZone;
    resourceType: ResourceType;
    status: AvailabilityStatus;
    severity: number;
    queueDepth?: string;
    waterTemperature?: string;
    note: string;
  }
): Promise<{ entityKey: string; txHash: string; expiresAt: bigint }> {
  const walletClient = createWalletClient({
    chain: tiramisu,
    transport: custom(ethereumProvider),
    account: accountAddress,
  });

  const lifetimeHours = params.status === "unavailable" ? 4 : 2;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const payload: AvailabilityObservation["payload"] = {
    queue_depth_estimate: params.queueDepth,
    water_temperature: params.waterTemperature,
    observation_note: params.note,
    synthetic_demo: true,
  };

  const res = await walletClient.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: {
      project_id: str(PROJECT_ID),
      entity_type: str("availability_observation"),
      relief_point_key: arkivKey(params.reliefPointKey),
      city: str("pune"),
      zone: str(params.zone),
      resource_type: str(params.resourceType),
      status: str(params.status),
      severity: i32(params.severity),
      observed_at: u64(nowSeconds),
    },
    expires: ExpirationTime.fromHours(lifetimeHours),
  });

  // Store in local memory for instantaneous UI feedback
  const newObs: AvailabilityObservation = {
    key: res.entityKey as `0x${string}`,
    creator: accountAddress,
    expiresAt: res.expiresAt,
    projectId: PROJECT_ID,
    entityType: "availability_observation",
    reliefPointKey: params.reliefPointKey,
    city: "pune",
    zone: params.zone,
    resourceType: params.resourceType,
    status: params.status,
    severity: params.severity,
    observedAt: nowSeconds,
    payload,
  };
  localObservations.unshift(newObs);

  return res;
}

export async function publishAttestation(
  ethereumProvider: any,
  accountAddress: `0x${string}`,
  params: {
    reliefPointKey: `0x${string}`;
    observationKey: `0x${string}`;
    verdict: AttestationVerdict;
    reason: string;
    note?: string;
  }
): Promise<{ entityKey: string; txHash: string; expiresAt: bigint }> {
  const walletClient = createWalletClient({
    chain: tiramisu,
    transport: custom(ethereumProvider),
    account: accountAddress,
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: Attestation["payload"] = {
    reason: params.reason,
    note: params.note,
    synthetic_demo: true,
  };

  const res = await walletClient.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: {
      project_id: str(PROJECT_ID),
      entity_type: str("attestation"),
      relief_point_key: arkivKey(params.reliefPointKey),
      observation_key: arkivKey(params.observationKey),
      verdict: str(params.verdict),
      observed_at: u64(nowSeconds),
    },
    expires: ExpirationTime.fromHours(4),
  });

  const newAttestation: Attestation = {
    key: res.entityKey as `0x${string}`,
    creator: accountAddress,
    expiresAt: res.expiresAt,
    projectId: PROJECT_ID,
    entityType: "attestation",
    reliefPointKey: params.reliefPointKey,
    observationKey: params.observationKey,
    verdict: params.verdict,
    observedAt: nowSeconds,
    payload,
  };
  localAttestations.push(newAttestation);

  return res;
}

export function subscribeToArkivEvents(
  onEvent: (type: string, key: string) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const wsClient = createPublicClient({
      chain: tiramisu,
      transport: webSocket(TIRAMISU_WS_RPC),
    });

    const unwatch = wsClient.watchEntityEvents({
      onEntityCreated: (event) => onEvent("EntityCreated", event.entityKey),
      onEntityPatched: (event) => onEvent("EntityPatched", event.entityKey),
      onExpiryExtended: (event) => onEvent("ExpiryExtended", event.entityKey),
      onError: (err) => {
        if (onError) onError(err);
      },
    });

    return unwatch;
  } catch (err) {
    console.warn("WebSocket transport failed, falling back to passive listener:", err);
    return () => {};
  }
}
