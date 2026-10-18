import React from "react";
import { Locale, translations } from "../i18n/translations";
import { ShieldCheck, Database, Globe, Wallet } from "lucide-react";

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (newLocale: Locale) => void;
  walletAddress: `0x${string}` | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenEvidence: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  locale,
  onLocaleChange,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  onOpenEvidence,
}) => {
  const t = translations[locale];

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-main)",
        backgroundColor: "var(--bg-card)",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="container">
        {/* Top bar: Brand + Badges + Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {/* Brand and Track Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                backgroundColor: "var(--color-water)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.125rem",
              }}
              aria-hidden="true"
            >
              जल
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {t.appName}
                </h1>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--color-water)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Pune Live
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {t.appTagline}
              </p>
            </div>
          </div>

          {/* Action and Configuration Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Network pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.25rem 0.625rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "4px",
                border: "1px solid var(--border-main)",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
              title="Connected to Arkiv Tiramisu Testnet"
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-sage)",
                  display: "inline-block",
                }}
              />
              <span className="mono">{t.networkBadge}</span>
            </div>

            {/* Language Selector */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid var(--border-strong)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
              role="group"
              aria-label="Language Selector"
            >
              <span style={{ padding: "0 0.375rem", display: "flex", alignItems: "center" }} aria-hidden="true">
                <Globe size={14} color="var(--text-muted)" />
              </span>
              <button
                onClick={() => onLocaleChange("en")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "en" ? 700 : 500,
                  backgroundColor: locale === "en" ? "var(--bg-muted)" : "transparent",
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
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "mr" ? 700 : 500,
                  backgroundColor: locale === "mr" ? "var(--bg-muted)" : "transparent",
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
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: locale === "hi" ? 700 : 500,
                  backgroundColor: locale === "hi" ? "var(--bg-muted)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-pressed={locale === "hi"}
              >
                हिंदी
              </button>
            </div>

            {/* Judge Evidence Drawer Button */}
            <button
              onClick={onOpenEvidence}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-canvas)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Database size={15} color="var(--color-water)" />
              <span>{t.evidenceInspector.title}</span>
            </button>

            {/* Wallet Connect / Disconnect */}
            {walletAddress ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.375rem 0.625rem",
                    backgroundColor: "var(--color-sage-subtle)",
                    color: "var(--color-sage)",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                  title={walletAddress}
                >
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={onDisconnectWallet}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.375rem 0.5rem",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {t.disconnectWallet}
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "4px",
                  border: "1px solid var(--color-water)",
                  backgroundColor: "var(--color-water)",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Wallet size={15} />
                <span>{t.connectWallet}</span>
              </button>
            )}
          </div>
        </div>

        {/* Synthetic Demo Banner Notice */}
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: "var(--color-amber-subtle)",
            color: "var(--color-amber)",
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <ShieldCheck size={14} />
          <span>{t.syntheticNotice}</span>
        </div>
      </div>
    </header>
  );
};
