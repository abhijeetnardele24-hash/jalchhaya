import { describe, it, expect } from "vitest";
import {
  ReliefPointPayloadSchema,
  AvailabilityObservationPayloadSchema,
  AttestationPayloadSchema,
  IncidentPayloadSchema,
  PuneZoneEnum,
  ResourceTypeEnum,
  AvailabilityStatusEnum,
  AttestationVerdictEnum,
} from "../../src/types/schema";

describe("Schema and Domain Enums", () => {
  it("validates PuneZoneEnum values correctly", () => {
    expect(PuneZoneEnum.safeParse("deccan").success).toBe(true);
    expect(PuneZoneEnum.safeParse("shivajinagar").success).toBe(true);
    expect(PuneZoneEnum.safeParse("hadapsar").success).toBe(true);
    expect(PuneZoneEnum.safeParse("invalid_zone").success).toBe(false);
  });

  it("validates ResourceTypeEnum values correctly", () => {
    expect(ResourceTypeEnum.safeParse("water").success).toBe(true);
    expect(ResourceTypeEnum.safeParse("cooling_centre").success).toBe(true);
    expect(ResourceTypeEnum.safeParse("shade").success).toBe(true);
    expect(ResourceTypeEnum.safeParse("first_aid_ors").success).toBe(true);
    expect(ResourceTypeEnum.safeParse("grocery").success).toBe(false);
  });

  it("validates AvailabilityStatusEnum values correctly", () => {
    expect(AvailabilityStatusEnum.safeParse("available").success).toBe(true);
    expect(AvailabilityStatusEnum.safeParse("crowded").success).toBe(true);
    expect(AvailabilityStatusEnum.safeParse("unavailable").success).toBe(true);
    expect(AvailabilityStatusEnum.safeParse("unknown").success).toBe(false);
  });

  it("validates AttestationVerdictEnum values correctly", () => {
    expect(AttestationVerdictEnum.safeParse("confirm").success).toBe(true);
    expect(AttestationVerdictEnum.safeParse("challenge").success).toBe(true);
    expect(AttestationVerdictEnum.safeParse("maybe").success).toBe(false);
  });

  it("validates ReliefPointPayloadSchema correctly", () => {
    const valid = {
      name: "Deccan PMT Bus Terminal Water Kiosk",
      name_mr: "डेक्कन पाणपोई",
      name_hi: "डेक्कन प्याऊ",
      address_hint: "Opposite Platform 3",
      amenities: ["Chilled pot water", "Clean glasses"],
      operating_hours: "06:00 - 22:00 IST",
      synthetic_demo: true,
    };
    expect(ReliefPointPayloadSchema.safeParse(valid).success).toBe(true);

    // Live on-chain records can omit synthetic_demo or have false
    const liveRecord = { ...valid, synthetic_demo: false };
    expect(ReliefPointPayloadSchema.safeParse(liveRecord).success).toBe(true);

    // Missing required name fails
    const invalid = { ...valid, name: "" };
    expect(ReliefPointPayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates AvailabilityObservationPayloadSchema", () => {
    const valid = {
      queue_depth_estimate: "5 people",
      water_temperature: "Cold",
      observation_note: "Clean flow from both taps",
      synthetic_demo: true as const,
    };
    expect(AvailabilityObservationPayloadSchema.safeParse(valid).success).toBe(true);

    const noteTooLong = {
      ...valid,
      observation_note: "a".repeat(250),
    };
    expect(AvailabilityObservationPayloadSchema.safeParse(noteTooLong).success).toBe(false);
  });

  it("validates AttestationPayloadSchema", () => {
    const valid = {
      reason: "verified_usable",
      note: "Confirmed flow at 14:00",
      synthetic_demo: true as const,
    };
    expect(AttestationPayloadSchema.safeParse(valid).success).toBe(true);

    const missingReason = {
      note: "Confirmed flow at 14:00",
      synthetic_demo: true as const,
    };
    expect(AttestationPayloadSchema.safeParse(missingReason).success).toBe(false);
  });

  it("validates IncidentPayloadSchema", () => {
    const valid = {
      headline: "Water Tanker Refill Delayed",
      action_guidance: "Route to Swargate depot",
      synthetic_demo: true as const,
    };
    expect(IncidentPayloadSchema.safeParse(valid).success).toBe(true);

    const emptyHeadline = {
      headline: "",
      action_guidance: "Route to Swargate depot",
      synthetic_demo: true as const,
    };
    expect(IncidentPayloadSchema.safeParse(emptyHeadline).success).toBe(false);
  });
});
