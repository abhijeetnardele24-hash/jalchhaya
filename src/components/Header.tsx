import React from "react";
import { Locale, translations } from "../i18n/translations";
import { Database, Globe, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { ConnectionState } from "../lib/arkivService";
import { DataSourceMode } from "../types/schema";

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (newLocale: Locale) => void;
  walletAddress: `0x${string}` | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenEvidence: () => void;
  connectionState: ConnectionState;
  lastEventAt: Date | null;
  dataSourceMode: DataSourceMode;
  onToggleDataMode: () => void;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  locale,
  onLocaleChange,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  onOpenEvidence,
  connectionState,
  lastEventAt,
  dataSourceMode,
  onToggleDataMode,
  isOffline = false,
}) => {
  const t = translations[locale];

  const getConnectionDotColor = () => {
    if (isOffline) return "#718285";
    switch (connectionState) {
      case "connected":
        return "var(--c-leaf)";
      case "reconnecting":
      case "connecting":
        return "var(--c-sun)";
      case "degraded":
        return "#718285";
      case "disconnected":
      default:
        return "var(--c-heat)";
    }
  };

  const getConnectionLabel = () => {
    if (isOffline) return "Offline: Cached Directory";
    switch (connectionState) {
      case "connected":
        return "Arkiv WS: Connected";
      case "connecting":
        return "Arkiv WS: Connecting…";
      case "reconnecting":
        return "Arkiv WS: Reconnecting…";
      case "degraded":
        return "Arkiv: RPC Degraded";
      case "disconnected":
      default:
        return "Arkiv: Disconnected";
    }
  };

  return (
    <header
      style={{
        borderBottom: "1px solid var(--c-border)",
        backgroundColor: "var(--c-paper)",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          data-testid="offline-indicator"
          style={{
            backgroundColor: "var(--c-sand)",
            borderBottom: "1px solid var(--c-border)",
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--c-navy)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textAlign: "center",
          }}
        >
          <AlertCircle size={16} color="var(--c-heat)" aria-hidden="true" />
          <span>Offline Mode (Cached Relief Directory) — Device is offline. Cached read access is preserved. Writes to Arkiv are disabled until network is restored.</span>
        </div>
      )}
      <div className="container">
        {/* Top Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {/* Brand & Civic Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "4px",
                backgroundColor: "var(--c-monsoon)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.125rem",
                boxShadow: "0 1px 3px rgba(8, 111, 131, 0.3)",
              }}
              aria-hidden="true"
            >
              जल
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--c-deep-ink)" }}>
                  {t.appName}
                </h1>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "var(--c-monsoon)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    backgroundColor: "var(--c-water-subtle)",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "3px",
                  }}
                >
                  Pune Civic Field Grid
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>
                {t.appTagline}
              </p>
            </div>
          </div>

          {/* Action & Configuration Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Live vs Demo Toggle Switch */}
            <button
              onClick={onToggleDataMode}
              className="btn-secondary"
              title="Click to toggle between live on-chain Arkiv data and synthetic demo scenario"
              style={{
                fontSize: "0.75rem",
                padding: "0.35rem 0.625rem",
              }}
            >
              <RefreshCw size={13} aria-hidden="true" />
              <span>Mode: </span>
              <strong style={{ color: dataSourceMode === "LIVE" ? "var(--c-leaf)" : "#8C560A" }}>
                {dataSourceMode}
              </strong>
            </button>

            {/* Network State Machine Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.35rem 0.625rem",
                backgroundColor: "var(--c-sand-subtle)",
                borderRadius: "4px",
                border: "1px solid var(--c-border)",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
              title={lastEventAt ? `Last confirmed event at ${lastEventAt.toLocaleTimeString()}` : "Arkiv Tiramisu Network (Chain ID: 7738577)"}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: getConnectionDotColor(),
                  display: "inline-block",
                }}
              />
              <span className="mono">{getConnectionLabel()}</span>
            </div>

            {/* Language Selector */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid var(--c-border-strong)",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "var(--c-paper)",
              }}
              role="group"
              aria-label="Language Selector"
            >
              <span style={{ padding: "0 0.375rem", display: "flex", alignItems: "center" }} aria-hidden="true">
                <Globe size={13} color="var(--c-text-muted)" />
              </span>
              <button
                onClick={() => onLocaleChange("en")}
                style={{
                  padding: "0.35rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "en" ? 700 : 500,
                  backgroundColor: locale === "en" ? "var(--c-sand)" : "transparent",
                  color: "var(--c-deep-ink)",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-pressed={locale === "en"}
              >
                EN
              </button>
              <button
                onClick={() => onLocaleChange("mr")}
                style={{
                  padding: "0.35rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "mr" ? 700 : 500,
                  backgroundColor: locale === "mr" ? "var(--c-sand)" : "transparent",
                  color: "var(--c-deep-ink)",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-pressed={locale === "mr"}
              >
                मराठी
              </button>
              <button
                onClick={() => onLocaleChange("hi")}
                style={{
                  padding: "0.35rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "hi" ? 700 : 500,
                  backgroundColor: locale === "hi" ? "var(--c-sand)" : "transparent",
                  color: "var(--c-deep-ink)",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-pressed={locale === "hi"}
              >
                हिंदी
              </button>
            </div>

            {/* Evidence Inspector Button */}
            <button
              onClick={onOpenEvidence}
              className="btn-secondary"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.625rem" }}
            >
              <Database size={13} color="var(--c-monsoon)" aria-hidden="true" />
              <span>{t.evidenceInspector.title}</span>
            </button>

            {/* Wallet Connect / Disconnect */}
            {walletAddress ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.625rem",
                    backgroundColor: "var(--c-leaf-subtle)",
                    color: "var(--c-leaf)",
                    border: "1px solid rgba(56, 122, 98, 0.25)",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                  title={walletAddress}
                >
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={onDisconnectWallet}
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                >
                  {t.disconnectWallet}
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="btn-primary"
                style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
              >
                <Wallet size={13} aria-hidden="true" />
                <span>{t.connectWallet}</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Source Truth Banner */}
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: dataSourceMode === "LIVE" ? "var(--c-leaf-subtle)" : "var(--c-sun-subtle)",
            color: dataSourceMode === "LIVE" ? "var(--c-leaf)" : "#8C560A",
            fontSize: "0.6875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            border: `1px solid ${dataSourceMode === "LIVE" ? "rgba(56, 122, 98, 0.25)" : "rgba(233, 162, 59, 0.35)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <AlertCircle size={13} aria-hidden="true" />
            <span>
              {dataSourceMode === "LIVE"
                ? "Live Verified Mode · Displaying genuine records fetched directly from Arkiv Tiramisu on-chain index."
                : "Demonstration Scenario · Labelled synthetic baseline for hackathon evaluation and disconnected environments."}
            </span>
          </div>
          <span className="mono" style={{ fontSize: "0.625rem" }}>
            Chain ID: 7738577
          </span>
        </div>
      </div>
    </header>
  );
};
