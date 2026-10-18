import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchReliefPointsWithTruth,
  fetchIncidentsWithTruth,
  publishAvailabilityObservation,
  publishSubmissionDemoProof,
  SUBMISSION_PROOF_WALLET,
  publishAttestation,
  arkivConnectionManager,
  ensureTiramisuNetwork,
  calculateRemainingLifetime,
  ArkivConnectionManager,
} from "../../src/lib/arkivService";

vi.mock("@arkiv-network/sdk", () => {
  return {
    createPublicClient: vi.fn().mockImplementation(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(732950n),
      getChainId: vi.fn().mockResolvedValue(7738577),
      getBalance: vi.fn().mockResolvedValue(1_000_000_000_000_000_000n),
      getEntity: vi.fn().mockResolvedValue({ key: "0x123", attributes: {} }),
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            fetch: vi.fn().mockResolvedValue({ entities: [] }),
          }),
        }),
      }),
      watchEntityEvents: vi.fn().mockImplementation(() => {
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

describe("Arkiv Service & Connection State Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates remaining lifetime correctly across blocks", () => {
    // Current block 700000, expires at 700010 (20 seconds remaining)
    expect(calculateRemainingLifetime(700010n, 700000n)).toContain("min remaining");
    // Current block 700000, expires at 701800 (~1 hour remaining)
    expect(calculateRemainingLifetime(701800n, 700000n)).toBe("~1h remaining");
    // Current block 700000, expires at 750000 (~1 day remaining)
    expect(calculateRemainingLifetime(750000n, 700000n)).toContain("days remaining");
    // Expired
    expect(calculateRemainingLifetime(600000n, 700000n)).toBe("Expired");
  });

  it("fetches relief points with explicit source attribution (DEMO fallback on 0 entities)", async () => {
    const res = await fetchReliefPointsWithTruth("all");
    expect(res.source).toBe("DEMO");
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].source).toBe("DEMO");
    expect(res.data[0].statusConfidence).toBeDefined();
    expect(res.blockNumber).toBe(732950n);
  });

  it("filters relief points by specific zone in truth query", async () => {
    const res = await fetchReliefPointsWithTruth("swargate");
    expect(res.data.every((p) => p.zone === "swargate")).toBe(true);
  });

  it("forces DEMO mode when explicitly requested", async () => {
    const res = await fetchReliefPointsWithTruth("deccan", "DEMO");
    expect(res.source).toBe("DEMO");
    expect(res.data.every((p) => p.zone === "deccan")).toBe(true);
  });

  it("fetches incidents with truthful source", async () => {
    const res = await fetchIncidentsWithTruth("DEMO");
    expect(res.source).toBe("DEMO");
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].zone).toBe("hadapsar");
  });

  it("validates wallet network correctly and switches chain if wrong", async () => {
    // 1. Wrong chain (e.g. Ethereum Mainnet 0x1) -> triggers switch
    const mockProvider = {
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === "eth_chainId") return Promise.resolve("0x1");
        if (method === "wallet_switchEthereumChain") return Promise.resolve();
        return Promise.resolve();
      }),
    };

    const res = await ensureTiramisuNetwork(mockProvider);
    expect(res.success).toBe(true);
    expect(mockProvider.request).toHaveBeenCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7614d1" }],
    });
  });

  it("handles chain addition when wallet_switchEthereumChain throws 4902", async () => {
    const mockProvider = {
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === "eth_chainId") return Promise.resolve("0x1");
        if (method === "wallet_switchEthereumChain") {
          const err: any = new Error("Chain not added");
          err.code = 4902;
          return Promise.reject(err);
        }
        if (method === "wallet_addEthereumChain") return Promise.resolve();
        return Promise.resolve();
      }),
    };

    const res = await ensureTiramisuNetwork(mockProvider);
    expect(res.success).toBe(true);
    expect(mockProvider.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: "wallet_addEthereumChain" })
    );
  });

  it("manages connection state transitions deterministically", () => {
    const manager = new ArkivConnectionManager();
    const states: string[] = [];
    const unsub = manager.onStateChange((st) => states.push(st));

    expect(manager.getState()).toBe("connected");

    // Simulate disconnect
    manager.handleDisconnect();
    expect(manager.getState()).toBe("reconnecting");

    // Clean disconnect
    manager.disconnect();
    expect(manager.getState()).toBe("disconnected");

    unsub();
  });

  it("subscribes to live WebSocket events and tracks event updates", () => {
    const onEvent = vi.fn();
    const unsub = arkivConnectionManager.onEvent(onEvent);

    // Trigger mock event through connection manager
    (arkivConnectionManager as any).handleEvent("EntityCreated", "0xtest123");
    expect(onEvent).toHaveBeenCalledWith("EntityCreated", "0xtest123");
    expect(arkivConnectionManager.getLastConfirmedEventAt()).toBeInstanceOf(Date);

    unsub();
  });

  it("publishes availability observation with step updates and post-tx verification", async () => {
    const steps: string[] = [];
    const mockProvider = {
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === "eth_chainId") return Promise.resolve("0x7614d1");
        return Promise.resolve();
      }),
    };
    const walletAddress = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`;

    const res = await publishAvailabilityObservation(
      mockProvider,
      walletAddress,
      {
        reliefPointKey: "0x1111111111111111111111111111111111111111111111111111111111111101",
        zone: "deccan",
        resourceType: "water",
        status: "available",
        severity: 1,
        note: "Refreshed test observation",
      },
      (step) => steps.push(step)
    );

    expect(res.entityKey).toBeDefined();
    expect(steps).toContain("network_check");
    expect(steps).toContain("preparing");
    expect(steps).toContain("prompting_wallet");
    expect(steps).toContain("broadcasting");
    expect(steps).toContain("confirming");
    expect(steps).toContain("querying_arkiv");
    expect(steps).toContain("confirmed");
  });

  it("publishes only a labeled one-day synthetic proof from the approved wallet and verifies it", async () => {
    const steps: string[] = [];
    const mockProvider = {
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === "eth_chainId") return Promise.resolve("0x7614d1");
        if (method === "eth_accounts") return Promise.resolve([SUBMISSION_PROOF_WALLET]);
        return Promise.resolve();
      }),
    };

    const result = await publishSubmissionDemoProof(
      mockProvider,
      SUBMISSION_PROOF_WALLET,
      (step) => steps.push(step)
    );

    expect(result.verified).toBe(true);
    expect(result.entityKey).toBeDefined();
    expect(steps).toContain("prompting_wallet");
    expect(steps).toContain("confirmed");
    const { createWalletClient, jsonToPayload, ExpirationTime } = await import("@arkiv-network/sdk");
    expect(createWalletClient).toHaveBeenCalledWith(expect.objectContaining({ account: SUBMISSION_PROOF_WALLET }));
    expect(ExpirationTime.fromDays).toHaveBeenCalledWith(1);
    expect(jsonToPayload).toHaveBeenCalledWith(expect.objectContaining({
      record_kind: "protocol_integration_demo_proof",
      synthetic_demo: true,
      notice: expect.stringContaining("Not a real relief facility"),
    }));
  });

  it("refuses the synthetic proof for any wallet other than the user-approved address", async () => {
    const provider = { request: vi.fn() };
    await expect(publishSubmissionDemoProof(
      provider,
      "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`
    )).rejects.toThrow("Connect the approved proof wallet");
    expect(provider.request).not.toHaveBeenCalled();
  });

  it("publishes attestation with network verification and confirmed state", async () => {
    const steps: string[] = [];
    const mockProvider = {
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === "eth_chainId") return Promise.resolve("0x7614d1");
        return Promise.resolve();
      }),
    };
    const walletAddress = "0x5b52b2516184Cc635D1A1Bc410697E3a070aa471" as `0x${string}`;

    const res = await publishAttestation(
      mockProvider,
      walletAddress,
      {
        reliefPointKey: "0x1111111111111111111111111111111111111111111111111111111111111101",
        observationKey: "0x2222222222222222222222222222222222222222222222222222222222222201",
        verdict: "confirm",
        reason: "verified_in_person",
      },
      (step) => steps.push(step)
    );

    expect(res.entityKey).toBeDefined();
    expect(steps).toContain("confirmed");
  });
});
