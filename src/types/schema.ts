import { z } from "zod";

export const PROJECT_ID = "jalchhaya-pune-2026";

export const PuneZoneEnum = z.enum([
  "all",
  "shivajinagar",
  "deccan",
  "swargate",
  "hadapsar",
  "kothrud",
  "hinjawadi",
  "katraj",
  "yerawada",
]);
export type PuneZone = z.infer<typeof PuneZoneEnum>;

export const ResourceTypeEnum = z.enum([
  "water",
  "shade",
  "cooling_centre",
  "first_aid_ors",
]);
export type ResourceType = z.infer<typeof ResourceTypeEnum>;

export const AvailabilityStatusEnum = z.enum([
  "available",
  "crowded",
  "unavailable",
]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusEnum>;

export const AttestationVerdictEnum = z.enum(["confirm", "challenge"]);
export type AttestationVerdict = z.infer<typeof AttestationVerdictEnum>;

export const IncidentTypeEnum = z.enum([
  "water_outage",
  "power_failure",
  "extreme_crowding",
  "supply_exhausted",
]);
export type IncidentType = z.infer<typeof IncidentTypeEnum>;

// Payload schemas
export const ReliefPointPayloadSchema = z.object({
  name: z.string().min(1),
  name_mr: z.string().min(1),
  name_hi: z.string().min(1),
  address_hint: z.string().min(1),
  amenities: z.array(z.string()),
  operating_hours: z.string(),
  synthetic_demo: z.literal(true),
});
export type ReliefPointPayload = z.infer<typeof ReliefPointPayloadSchema>;

export const AvailabilityObservationPayloadSchema = z.object({
  queue_depth_estimate: z.string().optional(),
  water_temperature: z.string().optional(),
  observation_note: z.string().max(200),
  synthetic_demo: z.literal(true),
});
export type AvailabilityObservationPayload = z.infer<typeof AvailabilityObservationPayloadSchema>;

export const AttestationPayloadSchema = z.object({
  reason: z.string().min(1),
  note: z.string().max(200).optional(),
  synthetic_demo: z.literal(true),
});
export type AttestationPayload = z.infer<typeof AttestationPayloadSchema>;

export const IncidentPayloadSchema = z.object({
  headline: z.string().min(1),
  action_guidance: z.string().min(1),
  synthetic_demo: z.literal(true),
});
export type IncidentPayload = z.infer<typeof IncidentPayloadSchema>;

// Full Domain Models
export interface ReliefPoint {
  key: `0x${string}`;
  creator: `0x${string}`;
  owner: `0x${string}`;
  createdAt: bigint;
  expiresAt: bigint;
  creationFlags?: { readonly: boolean; permissionlessExtension: boolean; raw: number };
  projectId: string;
  entityType: "relief_point";
  city: string;
  zone: PuneZone;
  geohash5: string;
  resourceType: ResourceType;
  accessibility: "wheelchair_accessible" | "standard";
  operatorClass: "municipal" | "community_trust" | "transit_hub" | "merchant_association";
  payload: ReliefPointPayload;
  latestObservation?: AvailabilityObservation;
  attestations?: Attestation[];
}

export interface AvailabilityObservation {
  key: `0x${string}`;
  creator: `0x${string}`;
  createdAt?: bigint;
  expiresAt: bigint;
  projectId: string;
  entityType: "availability_observation";
  reliefPointKey: `0x${string}`;
  city: string;
  zone: PuneZone;
  resourceType: ResourceType;
  status: AvailabilityStatus;
  severity: number; // 1 (normal) to 5 (critical failure)
  observedAt: number; // Unix seconds
  payload: AvailabilityObservationPayload;
}

export interface Attestation {
  key: `0x${string}`;
  creator: `0x${string}`;
  expiresAt: bigint;
  projectId: string;
  entityType: "attestation";
  reliefPointKey: `0x${string}`;
  observationKey: `0x${string}`;
  verdict: AttestationVerdict;
  observedAt: number;
  payload: AttestationPayload;
}

export interface Incident {
  key: `0x${string}`;
  creator: `0x${string}`;
  expiresAt: bigint;
  projectId: string;
  entityType: "incident";
  reliefPointKey: `0x${string}`;
  city: string;
  zone: PuneZone;
  incidentType: IncidentType;
  severity: number;
  openedAt: number;
  payload: IncidentPayload;
}
