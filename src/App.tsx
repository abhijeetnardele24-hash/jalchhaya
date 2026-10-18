import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { ReliefPoint, Incident, PuneZone, DataSourceMode } from "./types/schema";
import { Locale } from "./i18n/translations";
import { Header } from "./components/Header";
import { ZoneMap } from "./components/ZoneMap";
import { ReliefBoard } from "./components/ReliefBoard";
import { IncidentBanner } from "./components/IncidentBanner";
import { LiveEventsFeed, LiveEventItem } from "./components/LiveEventsFeed";
import {
  fetchReliefPointsWithTruth,
  fetchIncidentsWithTruth,
  arkivConnectionManager,
  ConnectionState,
  TIRAMISU_EXPLORER,
} from "./lib/arkivService";
import { INITIAL_SYNTHETIC_POINTS, INITIAL_SYNTHETIC_INCIDENTS } from "./lib/mockData";
import { MapPin, ListFilter, PlusCircle, ExternalLink, ShieldCheck } from "lucide-react";

// Lazy-loaded modals and drawer for code splitting and lightweight initial reader bundle
const EvidenceInspector = lazy(() =>
  import("./components/EvidenceInspector").then((m) => ({ default: m.EvidenceInspector }))
);
const ObservationModal = lazy(() =>
  import("./components/ObservationModal").then((m) => ({ default: m.ObservationModal }))
);
const AttestationModal = lazy(() =>
  import("./components/AttestationModal").then((m) => ({ default: m.AttestationModal }))
);
const SubmissionProofModal = lazy(() =>
  import("./components/SubmissionProofModal").then((m) => ({ default: m.SubmissionProofModal }))
);

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedZone, setSelectedZone] = useState<PuneZone>("all");
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("LIVE");
  const [points, setPoints] = useState<ReliefPoint[]>(INITIAL_SYNTHETIC_POINTS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_SYNTHETIC_INCIDENTS);
  const [selectedPoint, setSelectedPoint] = useState<ReliefPoint | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Connection State Machine
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);

  // Subscribe to Browser Online/Offline Events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mobile View Toggle: "atlas" (map) vs "list" (relief board)
  const [mobileTab, setMobileTab] = useState<"atlas" | "list">("list");

  // Wallet State
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);

  // Modals & Drawers
  const [reportingPoint, setReportingPoint] = useState<ReliefPoint | null>(null);
  const [attestingPoint, setAttestingPoint] = useState<ReliefPoint | null>(null);
  const [inspectingPoint, setInspectingPoint] = useState<ReliefPoint | null>(null);
  const [submissionProofOpen, setSubmissionProofOpen] = useState(false);

  // Subscribe to Connection State changes
  useEffect(() => {
    const unsub = arkivConnectionManager.onStateChange((state, lastEvent) => {
      setConnectionState(state);
      setLastEventAt(lastEvent);
    });
    return unsub;
  }, []);

  // Load Data with truth attribution
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pointsResult, incidentsResult] = await Promise.all([
        fetchReliefPointsWithTruth(selectedZone, dataSourceMode),
        fetchIncidentsWithTruth(dataSourceMode),
      ]);
      setPoints(pointsResult.data);
      setIncidents(incidentsResult.data);
      if (pointsResult.source !== dataSourceMode) {
        setDataSourceMode(pointsResult.source);
      }
    } catch (err) {
      console.warn("Query fallback in App:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone, dataSourceMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if wallet is connected in browser
  useEffect(() => {
    const provider = (window as any).ethereum;
    if (provider) {
      if (provider.selectedAddress) {
        setWalletAddress(provider.selectedAddress as `0x${string}`);
      }
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0] as `0x${string}`);
        } else {
          setWalletAddress(null);
        }
      };
      provider.on?.("accountsChanged", handleAccountsChanged);
      return () => {
        provider.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const handleConnectWallet = async () => {
    const provider = (window as any).ethereum;
    if (!provider) {
      alert("No Ethereum wallet found. Please install MetaMask or another EVM wallet.");
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

  // Subscribe to live WebSocket events and auto-reconcile
  useEffect(() => {
    const unsub = arkivConnectionManager.onEvent((type, key) => {
      const newEvt: LiveEventItem = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        key,
        timestamp: new Date(),
      };
      setLiveEvents((prev) => [newEvt, ...prev].slice(0, 8));
      // Automatic state reconciliation following confirmed on-chain event
      loadData();
    });
    return unsub;
  }, [loadData]);

  const handleToggleDataMode = () => {
    setDataSourceMode((prev) => (prev === "LIVE" ? "DEMO" : "LIVE"));
  };

  // Zone Point Counts
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
      {/* Skip to Main Content Link for WCAG Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Sticky Header with real connection state and data source toggle */}
      <Header
        locale={locale}
        onLocaleChange={setLocale}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onOpenEvidence={() => setInspectingPoint(points[0] || INITIAL_SYNTHETIC_POINTS[0])}
        connectionState={connectionState}
        lastEventAt={lastEventAt}
        dataSourceMode={dataSourceMode}
        onToggleDataMode={handleToggleDataMode}
        isOffline={isOffline}
      />

      {/* Main Command Board Content */}
      <main id="main-content" tabIndex={-1} className="container" style={{ flex: 1, paddingTop: "1.25rem", paddingBottom: "4rem", outline: "none" }}>
        {/* Outage Alerts Banner */}
        <IncidentBanner incidents={incidents} locale={locale} />

        {/* Mobile View Toggle: Map Atlas vs List Control */}
        <div
          className="mobile-segmented-control"
          style={{
            display: "none",
            marginBottom: "1rem",
            border: "1px solid var(--c-border)",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "var(--c-paper)",
          }}
        >
          <button
            onClick={() => setMobileTab("list")}
            style={{
              flex: 1,
              padding: "0.625rem",
              border: "none",
              backgroundColor: mobileTab === "list" ? "var(--c-monsoon)" : "transparent",
              color: mobileTab === "list" ? "#FFFFFF" : "var(--c-deep-ink)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
            }}
            aria-pressed={mobileTab === "list"}
          >
            <ListFilter size={15} />
            <span>Relief Points List</span>
          </button>
          <button
            onClick={() => setMobileTab("atlas")}
            style={{
              flex: 1,
              padding: "0.625rem",
              border: "none",
              backgroundColor: mobileTab === "atlas" ? "var(--c-monsoon)" : "transparent",
              color: mobileTab === "atlas" ? "#FFFFFF" : "var(--c-deep-ink)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
            }}
            aria-pressed={mobileTab === "atlas"}
          >
            <MapPin size={15} />
            <span>Pune Atlas Map</span>
          </button>
        </div>

        {/* Desktop 60 / 40 Split Layout */}
        <div className="command-board-grid">
          {/* Left / Primary Column: Pune Relief Atlas + Geographic Canvas (~60%) */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <ZoneMap
              selectedZone={selectedZone}
              onSelectZone={(z) => {
                setSelectedZone(z);
                setSelectedPoint(null);
              }}
              locale={locale}
              pointCounts={pointCounts}
              selectedPoint={selectedPoint}
            />

            {/* Live Block Event Feed */}
            <LiveEventsFeed events={liveEvents} locale={locale} />
          </div>

          {/* Right Column: Priority Rail & Relief Board (~40%) */}
          <div>
            <ReliefBoard
              points={points}
              locale={locale}
              onOpenReportModal={setReportingPoint}
              onOpenAttestModal={setAttestingPoint}
              onInspectEntity={(p) => {
                setSelectedPoint(p);
                setInspectingPoint(p);
              }}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Reachable Mobile Bottom Action Bar */}
      <div
        className="mobile-action-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--c-paper)",
          borderTop: "1px solid var(--c-border)",
          padding: "0.5rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          zIndex: 35,
          boxShadow: "0 -2px 8px rgba(19, 42, 46, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span className="badge badge-live">{dataSourceMode}</span>
          <span className="mono" style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)" }}>
            Block #732922
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setReportingPoint(points[0] || INITIAL_SYNTHETIC_POINTS[0])}
            className="btn-primary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
          >
            <PlusCircle size={14} />
            <span>Report</span>
          </button>
          <button
            onClick={() => setInspectingPoint(points[0] || INITIAL_SYNTHETIC_POINTS[0])}
            className="btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.625rem" }}
          >
            Verify
          </button>
        </div>
      </div>

      {/* Civic Command Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--c-border)",
          backgroundColor: "var(--c-sand-subtle)",
          paddingTop: "2rem",
          paddingBottom: "4rem",
          fontSize: "0.8125rem",
          color: "var(--c-text-secondary)",
        }}
      >
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <section
            aria-labelledby="submission-proof-heading"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", padding: "1rem 1.125rem", border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-paper)", boxShadow: "var(--shadow-subtle)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", maxWidth: 700 }}>
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 38, height: 38, flex: "0 0 auto", borderRadius: 8, background: "var(--c-water-subtle)", color: "var(--c-monsoon)" }}><ShieldCheck size={20} /></span>
              <div>
                <h2 id="submission-proof-heading" style={{ fontSize: ".875rem", color: "var(--c-deep-ink)", fontWeight: 800 }}>Optional protocol proof · synthetic only</h2>
                <p style={{ fontSize: ".78rem", color: "var(--c-text-secondary)", marginTop: ".15rem" }}>Demonstrates one real Arkiv testnet write without creating or implying a real civic availability report. The record expires after one day.</p>
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setSubmissionProofOpen(true)} aria-haspopup="dialog" style={{ whiteSpace: "nowrap" }}>
              <ShieldCheck size={15} aria-hidden="true" /> Open proof flow
            </button>
          </section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div style={{ maxWidth: "520px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    backgroundColor: "var(--c-monsoon)",
                    color: "#FFFFFF",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "3px",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  JALCHHAYA
                </span>
                <strong style={{ color: "var(--c-deep-ink)" }}>
                  Verifiable Heat-Relief Command Board · Arkiv Global Tour Stop (Pre-Devcon)
                </strong>
              </div>
              <p style={{ lineHeight: 1.5, fontSize: "0.75rem" }}>
                Civic field instrument for Pune delivery riders and outdoor workers. Uses Arkiv as the authoritative verifiable database layer with native Entity Expiration, Lifetime Extension, and WebSocket block subscriptions.
              </p>
            </div>

            {/* Official Heat-Health Sources */}
            <div style={{ fontSize: "0.75rem" }}>
              <strong style={{ color: "var(--c-deep-ink)", display: "block", marginBottom: "0.375rem" }}>
                National Heat Action Guidelines:
              </strong>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <li>
                  <a
                    href="https://www.ncdc.mohfw.gov.in/uploads/pdf/heat1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--c-monsoon)", textDecoration: "none", fontWeight: 600 }}
                  >
                    NCDC Heat Preparedness Guidance (PDF) <ExternalLink size={10} style={{ display: "inline" }} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://mausam.imd.gov.in/responsive/heatwave_guidance.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--c-monsoon)", textDecoration: "none", fontWeight: 600 }}
                  >
                    IMD National Heatwave Advisory <ExternalLink size={10} style={{ display: "inline" }} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href={TIRAMISU_EXPLORER}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--c-monsoon)", textDecoration: "none", fontWeight: 600 }}
                  >
                    Arkiv Tiramisu Explorer <ExternalLink size={10} style={{ display: "inline" }} aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--c-border)",
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
              Canonical Project: <strong className="mono">jalchhaya-pune-2026</strong> · MIT License
            </span>
            <span>Authored by Abhijeet Nardele · Built for Pune Heat Action Resilience</span>
          </div>
        </div>
      </footer>

      {/* Lazy Loaded Modals & Drawers with Suspense */}
      <Suspense fallback={null}>
        {reportingPoint && (
          <ObservationModal
            isOpen={!!reportingPoint}
            onClose={() => setReportingPoint(null)}
            point={reportingPoint}
            walletAddress={walletAddress}
            locale={locale}
            onSuccess={loadData}
          />
        )}

        {attestingPoint && (
          <AttestationModal
            isOpen={!!attestingPoint}
            onClose={() => setAttestingPoint(null)}
            point={attestingPoint}
            walletAddress={walletAddress}
            locale={locale}
            onSuccess={loadData}
          />
        )}

        {inspectingPoint && (
          <EvidenceInspector
            isOpen={!!inspectingPoint}
            onClose={() => setInspectingPoint(null)}
            point={inspectingPoint}
            locale={locale}
          />
        )}
        <SubmissionProofModal
          isOpen={submissionProofOpen}
          onClose={() => setSubmissionProofOpen(false)}
          walletAddress={walletAddress}
        />
      </Suspense>
    </div>
  );
};
