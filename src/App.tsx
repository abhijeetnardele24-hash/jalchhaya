import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ReliefPoint, Incident, PuneZone } from "./types/schema";
import { Locale } from "./i18n/translations";
import { Header } from "./components/Header";
import { ZoneMap } from "./components/ZoneMap";
import { ReliefBoard } from "./components/ReliefBoard";
import { IncidentBanner } from "./components/IncidentBanner";
import { LiveEventsFeed, LiveEventItem } from "./components/LiveEventsFeed";
import { EvidenceInspector } from "./components/EvidenceInspector";
import { ObservationModal } from "./components/ObservationModal";
import { AttestationModal } from "./components/AttestationModal";
import {
  fetchReliefPoints,
  fetchIncidents,
  subscribeToArkivEvents,
  TIRAMISU_EXPLORER,
} from "./lib/arkivService";
import {
  INITIAL_SYNTHETIC_POINTS,
  INITIAL_SYNTHETIC_OBSERVATIONS,
  INITIAL_SYNTHETIC_INCIDENTS,
} from "./lib/mockData";
import { ExternalLink } from "lucide-react";

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedZone, setSelectedZone] = useState<PuneZone>("all");
  const [points, setPoints] = useState<ReliefPoint[]>(() =>
    INITIAL_SYNTHETIC_POINTS.map((pt) => ({
      ...pt,
      latestObservation:
        INITIAL_SYNTHETIC_OBSERVATIONS.find((o) => o.reliefPointKey === pt.key) ||
        INITIAL_SYNTHETIC_OBSERVATIONS[0],
    }))
  );
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_SYNTHETIC_INCIDENTS);
  const [liveEvents, setLiveEvents] = useState<LiveEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Wallet
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);

  // Modals & Drawers
  const [reportingPoint, setReportingPoint] = useState<ReliefPoint | null>(null);
  const [attestingPoint, setAttestingPoint] = useState<ReliefPoint | null>(null);
  const [inspectingPoint, setInspectingPoint] = useState<ReliefPoint | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPoints, fetchedIncidents] = await Promise.all([
        fetchReliefPoints(selectedZone),
        fetchIncidents(),
      ]);
      setPoints(fetchedPoints);
      setIncidents(fetchedIncidents);
    } catch (err) {
      console.error("Error loading data from Arkiv:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if wallet already connected in browser
  useEffect(() => {
    const checkWallet = async () => {
      const provider = (window as any).ethereum;
      if (provider && provider.selectedAddress) {
        setWalletAddress(provider.selectedAddress as `0x${string}`);
      }
    };
    checkWallet();
  }, []);

  // Connect wallet
  const handleConnectWallet = async () => {
    const provider = (window as any).ethereum;
    if (!provider) {
      alert("No Ethereum wallet found. Please install MetaMask or another EVM wallet to publish observations.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0] as `0x${string}`);
      }
    } catch (err) {
      console.warn("Wallet connection rejected:", err);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
  };

  // Subscribe to live WebSocket events
  useEffect(() => {
    const unwatch = subscribeToArkivEvents((type, key) => {
      const newEvt: LiveEventItem = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        key,
        timestamp: new Date(),
      };
      setLiveEvents((prev) => [newEvt, ...prev].slice(0, 10));
      // Refresh board data when a live event lands
      loadData();
    });

    return () => {
      unwatch();
    };
  }, [loadData]);

  // Calculate counts per zone
  const pointCounts = useMemo(() => {
    const counts: Record<PuneZone, number> = {
      all: points.length,
      shivajinagar: 0,
      deccan: 0,
      swargate: 0,
      hadapsar: 0,
      kothrud: 0,
      hinjawadi: 0,
      katraj: 0,
      yerawada: 0,
    };
    points.forEach((p) => {
      if (counts[p.zone] !== undefined) {
        counts[p.zone] += 1;
      }
    });
    return counts;
  }, [points]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Sticky Header with navigation & wallet */}
      <Header
        locale={locale}
        onLocaleChange={setLocale}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onOpenEvidence={() => setInspectingPoint(points[0] || INITIAL_SYNTHETIC_POINTS[0])}
      />

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
        {/* Incident Outage Banner if any active severe events */}
        <IncidentBanner incidents={incidents} locale={locale} />

        {/* Spatial Zone Grid Navigation */}
        <ZoneMap
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          locale={locale}
          pointCounts={pointCounts}
        />

        {/* Live WebSocket Event Stream indicator */}
        <LiveEventsFeed events={liveEvents} locale={locale} />

        {/* Primary Relief Board (Filters + Cards Grid) */}
        <ReliefBoard
          points={points}
          locale={locale}
          onOpenReportModal={setReportingPoint}
          onOpenAttestModal={setAttestingPoint}
          onInspectEntity={setInspectingPoint}
          onRefresh={loadData}
          isLoading={isLoading}
        />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-main)",
          backgroundColor: "var(--bg-card)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
        }}
      >
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div style={{ maxWidth: "480px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    backgroundColor: "var(--color-water)",
                    color: "#FFFFFF",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                  }}
                >
                  JALCHHAYA
                </span>
                <strong style={{ color: "var(--text-ink)" }}>Arkiv Global Tour Stop (Pre-Devcon)</strong>
              </div>
              <p style={{ lineHeight: 1.5, fontSize: "0.75rem" }}>
                Built strictly on Arkiv Network as the authoritative database layer. Uses native Entity Expiration,
                Lifetime Extension, typed compound predicates, and WebSocket entity event subscriptions without centralized indexers.
              </p>
            </div>

            {/* Research & Source citations */}
            <div style={{ fontSize: "0.75rem" }}>
              <strong style={{ color: "var(--text-ink)", display: "block", marginBottom: "0.375rem" }}>
                Official India Heat-Health References:
              </strong>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <li>
                  <a
                    href="https://www.ncdc.mohfw.gov.in/uploads/pdf/heat1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-water)", textDecoration: "none" }}
                  >
                    NCDC Heat Preparedness Guidance (PDF) <ExternalLink size={10} style={{ display: "inline" }} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://mausam.imd.gov.in/responsive/heatwave_guidance.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-water)", textDecoration: "none" }}
                  >
                    IMD National Heatwave Advisory <ExternalLink size={10} style={{ display: "inline" }} />
                  </a>
                </li>
                <li>
                  <a
                    href={TIRAMISU_EXPLORER}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-water)", textDecoration: "none" }}
                  >
                    Arkiv Tiramisu Explorer <ExternalLink size={10} style={{ display: "inline" }} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border-main)",
              paddingTop: "0.875rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              fontSize: "0.6875rem",
            }}
          >
            <span>
              Synthetic Demo Data for Hackathon Evaluation · All reports are mock records on Tiramisu testnet.
            </span>
            <span>MIT License · Abhijeet Nardele (India)</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ObservationModal
        isOpen={!!reportingPoint}
        onClose={() => setReportingPoint(null)}
        point={reportingPoint}
        walletAddress={walletAddress}
        locale={locale}
        onSuccess={loadData}
      />

      <AttestationModal
        isOpen={!!attestingPoint}
        onClose={() => setAttestingPoint(null)}
        point={attestingPoint}
        walletAddress={walletAddress}
        locale={locale}
        onSuccess={loadData}
      />

      <EvidenceInspector
        isOpen={!!inspectingPoint}
        onClose={() => setInspectingPoint(null)}
        point={inspectingPoint}
        locale={locale}
      />
    </div>
  );
};
