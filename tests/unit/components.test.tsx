import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../../src/components/Header";
import { ZoneMap } from "../../src/components/ZoneMap";
import { ReliefCard } from "../../src/components/ReliefCard";
import { ReliefBoard } from "../../src/components/ReliefBoard";
import { EvidenceInspector } from "../../src/components/EvidenceInspector";
import { IncidentBanner } from "../../src/components/IncidentBanner";
import { LiveEventsFeed } from "../../src/components/LiveEventsFeed";
import { ObservationModal } from "../../src/components/ObservationModal";
import {
  INITIAL_SYNTHETIC_POINTS,
  INITIAL_SYNTHETIC_OBSERVATIONS,
  INITIAL_SYNTHETIC_INCIDENTS,
} from "../../src/lib/mockData";

describe("UI Components", () => {
  it("renders Header with language switch buttons and network badge", () => {
    const onLocaleChange = vi.fn();
    const onConnectWallet = vi.fn();
    const onDisconnectWallet = vi.fn();
    const onOpenEvidence = vi.fn();

    render(
      <Header
        locale="en"
        onLocaleChange={onLocaleChange}
        walletAddress={null}
        onConnectWallet={onConnectWallet}
        onDisconnectWallet={onDisconnectWallet}
        onOpenEvidence={onOpenEvidence}
        connectionState="connected"
        lastEventAt={null}
        dataSourceMode="LIVE"
        onToggleDataMode={vi.fn()}
      />
    );

    expect(screen.getByText("JalChhaya")).toBeInTheDocument();
    expect(screen.getByText(/Chain ID: 7738577/)).toBeInTheDocument();
    expect(screen.getByText("Arkiv WS: Connected")).toBeInTheDocument();

    const mrBtn = screen.getByText("मराठी");
    fireEvent.click(mrBtn);
    expect(onLocaleChange).toHaveBeenCalledWith("mr");

    const evidenceBtn = screen.getByText("Arkiv On-Chain Evidence Inspector");
    fireEvent.click(evidenceBtn);
    expect(onOpenEvidence).toHaveBeenCalled();
  });

  it("renders Header with connected wallet address and disconnect button", () => {
    const address = "0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279" as `0x${string}`;
    const onDisconnect = vi.fn();

    render(
      <Header
        locale="en"
        onLocaleChange={vi.fn()}
        walletAddress={address}
        onConnectWallet={vi.fn()}
        onDisconnectWallet={onDisconnect}
        onOpenEvidence={vi.fn()}
        connectionState="connected"
        lastEventAt={null}
        dataSourceMode="LIVE"
        onToggleDataMode={vi.fn()}
      />
    );

    expect(screen.getByText("0x8Bcb…0279")).toBeInTheDocument();
    const disconnectBtn = screen.getByText("Disconnect");
    fireEvent.click(disconnectBtn);
    expect(onDisconnect).toHaveBeenCalled();
  });

  it("renders ZoneMap with interactive zone filters and exercises all zone buttons", () => {
    const onSelectZone = vi.fn();
    const counts = {
      all: 6,
      shivajinagar: 1,
      deccan: 1,
      swargate: 1,
      hadapsar: 1,
      kothrud: 1,
      hinjawadi: 1,
      katraj: 0,
      yerawada: 0,
    };

    render(
      <ZoneMap
        selectedZone="all"
        onSelectZone={onSelectZone}
        locale="en"
        pointCounts={counts}
      />
    );

    expect(screen.getByText("Pune Civic Heat-Relief Atlas")).toBeInTheDocument();

    // Click zones
    const zonesToClick = [
      "Deccan Gymkhana",
      "Shivajinagar",
      "Swargate",
      "Hadapsar",
      "Kothrud",
      "Hinjawadi",
      "Katraj",
      "Yerawada",
    ];

    zonesToClick.forEach((name) => {
      const btn = screen.getByText(name);
      fireEvent.click(btn);
    });

    const allBtn = screen.getByRole("button", { name: /All Pune Zones/ });
    fireEvent.click(allBtn);

    expect(onSelectZone).toHaveBeenCalledTimes(9);
  });

  it("renders ReliefBoard and exercises all resource and status filter buttons", () => {
    render(
      <ReliefBoard
        points={INITIAL_SYNTHETIC_POINTS}
        locale="en"
        onOpenReportModal={vi.fn()}
        onOpenAttestModal={vi.fn()}
        onInspectEntity={vi.fn()}
        onRefresh={vi.fn()}
        isLoading={false}
      />
    );

    const resourceTypes = [
      "All Resources",
      "Drinking Water Kiosk",
      "Shaded Shelter",
      "Cooling Centre",
      "First Aid & ORS Station",
    ];

    resourceTypes.forEach((label) => {
      const btn = screen.getByRole("button", { name: label });
      fireEvent.click(btn);
    });

    const statusTypes = [
      "Any Status",
      "Confirmed Usable",
      "High Wait Time / Crowded",
      "Out of Service / Dry",
    ];

    statusTypes.forEach((label) => {
      const btn = screen.getByRole("button", { name: label });
      fireEvent.click(btn);
    });
  });

  it("renders ReliefCard with localized title, status badge, and action triggers", () => {
    const point = {
      ...INITIAL_SYNTHETIC_POINTS[0],
      latestObservation: INITIAL_SYNTHETIC_OBSERVATIONS[0],
    };
    const onReport = vi.fn();
    const onAttest = vi.fn();
    const onInspect = vi.fn();

    render(
      <ReliefCard
        point={point}
        locale="mr"
        onOpenReportModal={onReport}
        onOpenAttestModal={onAttest}
        onInspectEntity={onInspect}
      />
    );

    expect(screen.getByText("डेक्कन पीएमटी बस स्थानक पाणपोई")).toBeInTheDocument();
    expect(screen.getByText("सुरु व खात्रीशीर")).toBeInTheDocument();

    const reportBtn = screen.getByText("स्थिती नोंदवा");
    fireEvent.click(reportBtn);
    expect(onReport).toHaveBeenCalledWith(point);
  });

  it("renders IncidentBanner with urgent heat alerts", () => {
    render(
      <IncidentBanner incidents={INITIAL_SYNTHETIC_INCIDENTS} locale="en" />
    );

    expect(screen.getByText("Active Urgent Heat Alerts in Pune")).toBeInTheDocument();
    expect(screen.getByText(/Extreme Heat Spike/)).toBeInTheDocument();
  });

  it("renders LiveEventsFeed correctly", () => {
    const events = [
      {
        id: "1",
        type: "EntityCreated",
        key: "0x1234567890abcdef1234567890abcdef12345678",
        timestamp: new Date(),
      },
    ];

    render(<LiveEventsFeed events={events} locale="en" />);
    expect(screen.getByText("Live Arkiv WebSocket Stream")).toBeInTheDocument();
    expect(screen.getByText("EntityCreated")).toBeInTheDocument();
  });

  it("renders EvidenceInspector drawer when open and displays entity details", () => {
    const point = INITIAL_SYNTHETIC_POINTS[0];
    const onClose = vi.fn();

    render(
      <EvidenceInspector
        isOpen={true}
        onClose={onClose}
        point={point}
        locale="en"
      />
    );

    expect(screen.getByText("Arkiv On-Chain Evidence Inspector")).toBeInTheDocument();
    expect(screen.getByText(point.key)).toBeInTheDocument();
    expect(screen.getByText("Exact Reproducible SDK Query")).toBeInTheDocument();

    const closeBtn = screen.getByLabelText("Close Drawer");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("exercises status buttons in ObservationModal", () => {
    const point = INITIAL_SYNTHETIC_POINTS[0];
    render(
      <ObservationModal
        isOpen={true}
        onClose={vi.fn()}
        point={point}
        walletAddress="0x8Bcb4c38150DdFfA0572d0Daf21eDC82B9A20279"
        locale="en"
        onSuccess={vi.fn()}
      />
    );

    const availableBtn = screen.getByRole("button", { name: "Confirmed Usable" });
    fireEvent.click(availableBtn);

    const crowdedBtn = screen.getByRole("button", { name: "High Wait Time / Crowded" });
    fireEvent.click(crowdedBtn);

    const unavailableBtn = screen.getByRole("button", { name: "Out of Service / Dry" });
    fireEvent.click(unavailableBtn);
  });
});
