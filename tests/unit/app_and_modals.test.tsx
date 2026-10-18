import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "../../src/App";
import { ReliefBoard } from "../../src/components/ReliefBoard";
import { ObservationModal } from "../../src/components/ObservationModal";
import { AttestationModal } from "../../src/components/AttestationModal";
import { EvidenceInspector } from "../../src/components/EvidenceInspector";
import { ReliefCard } from "../../src/components/ReliefCard";
import * as arkivService from "../../src/lib/arkivService";
import {
  INITIAL_SYNTHETIC_POINTS,
  INITIAL_SYNTHETIC_OBSERVATIONS,
  INITIAL_SYNTHETIC_INCIDENTS,
} from "../../src/lib/mockData";

const MOCK_POINTS_WITH_OBS = INITIAL_SYNTHETIC_POINTS.map((pt) => ({
  ...pt,
  latestObservation:
    INITIAL_SYNTHETIC_OBSERVATIONS.find((obs) => obs.reliefPointKey === pt.key) ||
    INITIAL_SYNTHETIC_OBSERVATIONS[0],
}));

describe("App and Modals Comprehensive Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).ethereum = undefined;
  });

  describe("App Integration", () => {
    it("renders App, loads points and incidents, and toggles locale and drawer", async () => {
      const mockFetchPoints = vi.spyOn(arkivService, "fetchReliefPoints").mockResolvedValue(MOCK_POINTS_WITH_OBS);
      const mockFetchIncidents = vi.spyOn(arkivService, "fetchIncidents").mockResolvedValue(INITIAL_SYNTHETIC_INCIDENTS);
      vi.spyOn(arkivService, "subscribeToArkivEvents").mockImplementation((cb) => {
        setTimeout(() => cb("EntityCreated", "0x9999999999999999999999999999999999999999"), 10);
        return () => {};
      });

      render(<App />);

      expect(screen.getByText("JalChhaya")).toBeInTheDocument();
      expect(screen.getByText(/Verifiable Public Heat-Relief Availability Network/)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetchPoints).toHaveBeenCalled();
        expect(mockFetchIncidents).toHaveBeenCalled();
      });

      // Wait for point to be in document
      expect(await screen.findByText("Deccan PMT Bus Terminal Water Kiosk")).toBeInTheDocument();

      // Test Marathi switch
      const mrBtn = screen.getByText("मराठी");
      fireEvent.click(mrBtn);
      expect(await screen.findByText("डेक्कन पीएमटी बस स्थानक पाणपोई")).toBeInTheDocument();

      // Test Hindi switch
      const hiBtn = screen.getByText("हिंदी");
      fireEvent.click(hiBtn);
      expect(await screen.findByText("डेक्कन पीएमटी बस स्टैंड प्याऊ")).toBeInTheDocument();

      // Switch back to English
      const enBtn = screen.getByText("EN");
      fireEvent.click(enBtn);

      // Open on-chain inspector
      const inspectorTrigger = screen.getByText("Arkiv On-Chain Evidence Inspector");
      fireEvent.click(inspectorTrigger);
      expect(screen.getByText("Exact Reproducible SDK Query")).toBeInTheDocument();

      // Close inspector drawer
      const closeBtn = screen.getByLabelText("Close Drawer");
      fireEvent.click(closeBtn);

      // Connect wallet simulation without provider
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const connectBtn = screen.getByText("Connect Wallet to Report");
      fireEvent.click(connectBtn);
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("No Ethereum wallet found"));

      // Connect wallet simulation with provider
      (window as any).ethereum = {
        request: vi.fn().mockResolvedValue(["0x1111111111111111111111111111111111111111"]),
      };
      fireEvent.click(connectBtn);
      await waitFor(() => {
        expect(screen.getByText("0x1111…1111")).toBeInTheDocument();
      });

      // Disconnect
      const disconnectBtn = screen.getByText("Disconnect");
      fireEvent.click(disconnectBtn);
      expect(screen.getByText("Connect Wallet to Report")).toBeInTheDocument();
    });

    it("opens and handles Observation and Attestation modals from App flow", async () => {
      vi.spyOn(arkivService, "fetchReliefPoints").mockResolvedValue(MOCK_POINTS_WITH_OBS);
      vi.spyOn(arkivService, "fetchIncidents").mockResolvedValue(INITIAL_SYNTHETIC_INCIDENTS);
      vi.spyOn(arkivService, "subscribeToArkivEvents").mockReturnValue(() => {});

      render(<App />);

      const reportButtons = await screen.findAllByText("Update Status");
      expect(reportButtons.length).toBeGreaterThan(0);
      fireEvent.click(reportButtons[0]);

      // Check observation modal opened
      expect(screen.getByText("Publish Availability Observation")).toBeInTheDocument();
      const cancelObsBtn = screen.getByText("Cancel");
      fireEvent.click(cancelObsBtn);

      // Check attestation modal opened
      const verifyButtons = await screen.findAllByText("Confirm / Challenge");
      expect(verifyButtons.length).toBeGreaterThan(0);
      fireEvent.click(verifyButtons[0]);

      expect(screen.getByText("Submit Independent Attestation")).toBeInTheDocument();
      const cancelAttestBtn = screen.getByText("Cancel");
      fireEvent.click(cancelAttestBtn);
    });
  });

  describe("ReliefBoard Filtering and Search", () => {
    it("filters points by search text and resource type and triggers refresh", () => {
      const onReport = vi.fn();
      const onAttest = vi.fn();
      const onInspect = vi.fn();
      const onRefresh = vi.fn();

      render(
        <ReliefBoard
          points={MOCK_POINTS_WITH_OBS}
          locale="en"
          onOpenReportModal={onReport}
          onOpenAttestModal={onAttest}
          onInspectEntity={onInspect}
          onRefresh={onRefresh}
          isLoading={false}
        />
      );

      // Search
      const searchInput = screen.getByPlaceholderText(/Search by landmark, bus stop, or facility name/);
      fireEvent.change(searchInput, { target: { value: "Swargate" } });
      expect(screen.getByText("Swargate Chowk Red Cross ORS Booth")).toBeInTheDocument();
      expect(screen.queryByText("Deccan PMT Bus Terminal Water Kiosk")).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: "" } });

      // Resource filter
      const shadeFilterBtn = screen.getByRole("button", { name: "Shaded Shelter" });
      fireEvent.click(shadeFilterBtn);
      expect(screen.getByText("Hadapsar Gadital Gig-Worker Shade Pavilion")).toBeInTheDocument();

      // Status filter
      const crowdedFilterBtn = screen.getByRole("button", { name: "High Wait Time / Crowded" });
      fireEvent.click(crowdedFilterBtn);
      expect(screen.getByText("Hadapsar Gadital Gig-Worker Shade Pavilion")).toBeInTheDocument();

      // Refresh button
      const refreshBtn = screen.getByRole("button", { name: /Refresh relief points from Arkiv/i });
      fireEvent.click(refreshBtn);
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe("ObservationModal", () => {
    it("validates wallet presence and handles submission and cancel", async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const point = MOCK_POINTS_WITH_OBS[0];

      const { rerender } = render(
        <ObservationModal
          isOpen={false}
          onClose={onClose}
          point={point}
          walletAddress={null}
          locale="en"
          onSuccess={onSuccess}
        />
      );

      expect(screen.queryByText("Publish Availability Observation")).not.toBeInTheDocument();

      // Open with no wallet
      rerender(
        <ObservationModal
          isOpen={true}
          onClose={onClose}
          point={point}
          walletAddress={null}
          locale="en"
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText("Publish Availability Observation")).toBeInTheDocument();
      const submitBtn = screen.getByRole("button", { name: /Sign & Publish to Arkiv/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Please install an EVM wallet/)).toBeInTheDocument();

      // Open with connected wallet and simulate success
      const mockPublish = vi.spyOn(arkivService, "publishAvailabilityObservation").mockResolvedValue({
        txHash: "0x123",
        entityKey: "0xabc",
      } as any);

      (window as any).ethereum = {};

      rerender(
        <ObservationModal
          isOpen={true}
          onClose={onClose}
          point={point}
          walletAddress="0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"
          locale="en"
          onSuccess={onSuccess}
        />
      );

      const crowdedBtn = screen.getByRole("button", { name: "High Wait Time / Crowded" });
      fireEvent.click(crowdedBtn);

      const queueInput = screen.getByPlaceholderText(/e.g. 5-10 people/i);
      fireEvent.change(queueInput, { target: { value: "2 people" } });

      const tempInput = screen.getByPlaceholderText(/e.g. Chilled \/ Working/i);
      fireEvent.change(tempInput, { target: { value: "Chilled" } });

      const noteInput = screen.getByPlaceholderText(/Observation notes/i);
      fireEvent.change(noteInput, { target: { value: "Refilled 10 mins ago" } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockPublish).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("displays error message if publication fails", async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const point = MOCK_POINTS_WITH_OBS[0];

      vi.spyOn(arkivService, "publishAvailabilityObservation").mockRejectedValue(new Error("RPC Timeout on Arkiv"));
      (window as any).ethereum = {};

      render(
        <ObservationModal
          isOpen={true}
          onClose={onClose}
          point={point}
          walletAddress="0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"
          locale="en"
          onSuccess={onSuccess}
        />
      );

      const submitBtn = screen.getByRole("button", { name: /Sign & Publish to Arkiv/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("RPC Timeout on Arkiv")).toBeInTheDocument();
      });
    });
  });

  describe("AttestationModal", () => {
    it("handles attestation verdict switch and submission", async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const point = MOCK_POINTS_WITH_OBS[0];

      const mockAttest = vi.spyOn(arkivService, "publishAttestation").mockResolvedValue({
        txHash: "0x456",
        entityKey: "0xdef",
      } as any);

      (window as any).ethereum = {};

      render(
        <AttestationModal
          isOpen={true}
          onClose={onClose}
          point={point}
          walletAddress="0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"
          locale="en"
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText("Submit Independent Attestation")).toBeInTheDocument();
      expect(screen.getByText(/Target Observation by/)).toBeInTheDocument();

      // Switch to challenge
      const challengeRadio = screen.getByRole("radio", { name: /Challenge \(I dispute this observation\)/i });
      fireEvent.click(challengeRadio);

      const reasonInput = screen.getByPlaceholderText(/e.g. Verified drinking water flow at 13:30 IST/i);
      fireEvent.change(reasonInput, { target: { value: "Water tap is dry" } });

      const submitBtn = screen.getByRole("button", { name: /Sign & Attest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAttest).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("displays error message if attestation publication fails", async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const point = MOCK_POINTS_WITH_OBS[0];

      vi.spyOn(arkivService, "publishAttestation").mockRejectedValue(new Error("User rejected transaction signature"));
      (window as any).ethereum = {};

      render(
        <AttestationModal
          isOpen={true}
          onClose={onClose}
          point={point}
          walletAddress="0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"
          locale="en"
          onSuccess={onSuccess}
        />
      );

      const submitBtn = screen.getByRole("button", { name: /Sign & Attest/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("User rejected transaction signature")).toBeInTheDocument();
      });
    });
  });

  describe("EvidenceInspector and Copy Query", () => {
    it("copies query to clipboard when copy button clicked", async () => {
      const point = MOCK_POINTS_WITH_OBS[0];
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <EvidenceInspector
          isOpen={true}
          onClose={vi.fn()}
          point={point}
          locale="en"
        />
      );

      const copyBtn = screen.getByRole("button", { name: /Copy Query Code/i });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });
  });

  describe("ReliefCard Details and Edge Cases", () => {
    it("renders card without observation correctly and handles actions", () => {
      const pointNoObs = {
        ...INITIAL_SYNTHETIC_POINTS[0],
        latestObservation: undefined,
      };
      const onInspect = vi.fn();
      const onReport = vi.fn();
      const onAttest = vi.fn();

      render(
        <ReliefCard
          point={pointNoObs}
          locale="en"
          onOpenReportModal={onReport}
          onOpenAttestModal={onAttest}
          onInspectEntity={onInspect}
        />
      );

      expect(screen.getByText("No active recent observation. Facility status is unconfirmed.")).toBeInTheDocument();
      const inspectBtn = screen.getByRole("button", { name: "On-Chain Evidence" });
      fireEvent.click(inspectBtn);
      expect(onInspect).toHaveBeenCalledWith(pointNoObs);
    });
  });
});
