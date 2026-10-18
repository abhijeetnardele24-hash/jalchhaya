import { describe, it, expect, vi } from "vitest";
import {
  fetchReliefPoints,
  fetchIncidents,
  publishAvailabilityObservation,
  publishAttestation,
  subscribeToArkivEvents,
} from "../../src/lib/arkivService";

// Mock SDK methods
let mockWatchHandlers: any = {};

vi.mock("@arkiv-network/sdk", () => {
  return {
    createPublicClient: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            fetch: vi.fn().mockResolvedValue({ entities: [] }),
          }),
        }),
      }),
      watchEntityEvents: vi.fn().mockImplementation((handlers) => {
        mockWatchHandlers = handlers;
        return () => {};
      }),
    })),
    createWalletClient: vi.fn().mockReturnValue({
      createEntity: vi.fn().mockResolvedValue({
        entityKey: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        txHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
        expiresAt: 735000n,
      }),
    }),
    ExpirationTime: {
      fromHours: vi.fn().mockImplementation((h) => ({ hours: h })),
      fromDays: vi.fn().mockImplementation((d) => ({ days: d })),
    },
    jsonToPayload: vi.fn().mockImplementation((val) => new TextEncoder().encode(JSON.stringify(val))),
  };
});

describe("Arkiv Service Layer", () => {
  it("fetches relief points for all zones and attaches latest observations", async () => {
    const points = await fetchReliefPoints("all");
    expect(points.length).toBeGreaterThan(0);
    const deccanPoint = points.find((p) => p.zone === "deccan");
    expect(deccanPoint).toBeDefined();
    expect(deccanPoint?.latestObservation).toBeDefined();
    expect(deccanPoint?.latestObservation?.status).toBe("available");
  });

  it("filters relief points by specific zone", async () => {
    const swargatePoints = await fetchReliefPoints("swargate");
    expect(swargatePoints.every((p) => p.zone === "swargate")).toBe(true);
  });

  it("fetches incidents correctly", async () => {
    const incidents = await fetchIncidents();
    expect(incidents.length).toBeGreaterThan(0);
    expect(incidents[0].zone).toBe("hadapsar");
    expect(incidents[0].severity).toBeGreaterThanOrEqual(3);
  });

  it("publishes availability observation with calculated expiry and stores locally", async () => {
    const mockProvider = { request: vi.fn() };
    const walletAddress = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`;

    const res = await publishAvailabilityObservation(mockProvider, walletAddress, {
      reliefPointKey: "0x1111111111111111111111111111111111111111111111111111111111111101",
      zone: "deccan",
      resourceType: "water",
      status: "available",
      severity: 1,
      note: "Refreshed test observation",
    });

    expect(res.entityKey).toBeDefined();
    expect(res.txHash).toBeDefined();

    // Verify it is merged into points
    const points = await fetchReliefPoints("deccan");
    const deccan = points.find((p) => p.key === "0x1111111111111111111111111111111111111111111111111111111111111101");
    expect(deccan?.latestObservation?.key).toBe(res.entityKey);
  });

  it("publishes outage observation with 4-hour expiry branch", async () => {
    const mockProvider = { request: vi.fn() };
    const walletAddress = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`;

    const res = await publishAvailabilityObservation(mockProvider, walletAddress, {
      reliefPointKey: "0x1111111111111111111111111111111111111111111111111111111111111102",
      zone: "shivajinagar",
      resourceType: "cooling_centre",
      status: "unavailable",
      severity: 5,
      note: "Facility closed for repair",
    });

    expect(res.entityKey).toBeDefined();
  });

  it("publishes attestation correctly linked to observation", async () => {
    const mockProvider = { request: vi.fn() };
    const walletAddress = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`;

    const res = await publishAttestation(mockProvider, walletAddress, {
      reliefPointKey: "0x1111111111111111111111111111111111111111111111111111111111111101",
      observationKey: "0x2222222222222222222222222222222222222222222222222222222222222201",
      verdict: "confirm",
      reason: "Verified clean flow",
    });

    expect(res.entityKey).toBeDefined();
  });

  it("subscribes to live WebSocket events and triggers watcher callbacks", () => {
    const onEvent = vi.fn();
    const onError = vi.fn();
    const unwatch = subscribeToArkivEvents(onEvent, onError);
    expect(typeof unwatch).toBe("function");

    // Exercise callbacks
    mockWatchHandlers.onEntityCreated({ entityKey: "0x123" });
    expect(onEvent).toHaveBeenCalledWith("EntityCreated", "0x123");

    mockWatchHandlers.onEntityPatched({ entityKey: "0x456" });
    expect(onEvent).toHaveBeenCalledWith("EntityPatched", "0x456");

    mockWatchHandlers.onExpiryExtended({ entityKey: "0x789" });
    expect(onEvent).toHaveBeenCalledWith("ExpiryExtended", "0x789");

    const err = new Error("WS error");
    mockWatchHandlers.onError(err);
    expect(onError).toHaveBeenCalledWith(err);

    unwatch();
  });
});
