import React from "react";
import { ReliefPoint } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import {
  Droplet,
  Umbrella,
  Wind,
  HeartPulse,
  Clock,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import { TIRAMISU_EXPLORER, calculateRemainingLifetime } from "../lib/arkivService";

interface ReliefCardProps {
  point: ReliefPoint;
  locale: Locale;
  onOpenReportModal: (point: ReliefPoint) => void;
  onOpenAttestModal: (point: ReliefPoint) => void;
  onInspectEntity: (point: ReliefPoint) => void;
  isHighlighted?: boolean;
}

export const ReliefCard: React.FC<ReliefCardProps> = ({
  point,
  locale,
  onOpenReportModal,
  onOpenAttestModal,
  onInspectEntity,
  isHighlighted = false,
}) => {
  const t = translations[locale];
  const obs = point.latestObservation;

  // Localized title
  const title =
    locale === "mr" && point.payload.name_mr
      ? point.payload.name_mr
      : locale === "hi" && point.payload.name_hi
      ? point.payload.name_hi
      : point.payload.name;

  const renderResourceIcon = () => {
    switch (point.resourceType) {
      case "water":
        return <Droplet size={17} color="var(--c-monsoon)" aria-hidden="true" />;
      case "shade":
        return <Umbrella size={17} color="#8C560A" aria-hidden="true" />;
      case "cooling_centre":
        return <Wind size={17} color="var(--c-leaf)" aria-hidden="true" />;
      case "first_aid_ors":
        return <HeartPulse size={17} color="var(--c-heat)" aria-hidden="true" />;
      default:
        return <Droplet size={17} aria-hidden="true" />;
    }
  };

  const renderStatusBadge = () => {
    if (!obs) {
      return (
        <span
          className="badge"
          style={{ backgroundColor: "var(--c-sand)", color: "var(--c-deep-ink)", border: "1px solid var(--c-border-strong)" }}
        >
          <HelpCircle size={13} aria-hidden="true" />
          <span>{locale === "mr" ? "अपुष्ट" : locale === "hi" ? "अपुष्ट" : "Unconfirmed"}</span>
        </span>
      );
    }

    if (obs.status === "available") {
      return (
        <span className="badge" style={{ backgroundColor: "var(--c-leaf-subtle)", color: "var(--c-leaf)", border: "1px solid rgba(56, 122, 98, 0.3)" }}>
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>{t.statuses.available}</span>
        </span>
      );
    }

    if (obs.status === "crowded") {
      return (
        <span className="badge" style={{ backgroundColor: "var(--c-sun-subtle)", color: "#8C560A", border: "1px solid rgba(233, 162, 59, 0.4)" }}>
          <AlertTriangle size={13} aria-hidden="true" />
          <span>{t.statuses.crowded}</span>
        </span>
      );
    }

    return (
      <span className="badge" style={{ backgroundColor: "var(--c-heat-subtle)", color: "#9E261B", border: "1px solid rgba(217, 93, 79, 0.4)" }}>
        <XCircle size={13} aria-hidden="true" />
        <span>{t.statuses.unavailable}</span>
      </span>
    );
  };

  const renderSourceBadge = () => {
    if (point.source === "LIVE") {
      return <span className="badge badge-live">Live On-Chain</span>;
    }
    if (point.source === "DEGRADED") {
      return <span className="badge badge-degraded">Degraded RPC</span>;
    }
    return <span className="badge badge-demo">Demo Fixture</span>;
  };

  const formatMinutesAgo = (unixSeconds: number) => {
    const diffMins = Math.max(1, Math.floor((Date.now() / 1000 - unixSeconds) / 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  };

  const confirmationsCount = point.confirmCount ?? 0;
  const challengesCount = point.challengeCount ?? 0;

  return (
    <article
      className={`civic-card ${isHighlighted ? "civic-card-highlighted" : ""}`}
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "260px",
      }}
      aria-labelledby={`card-title-${point.key}`}
    >
      <div>
        {/* Top Badges Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
            flexWrap: "wrap",
            gap: "0.375rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.2rem 0.45rem",
                borderRadius: "3px",
                backgroundColor: "var(--c-sand-subtle)",
                border: "1px solid var(--c-border)",
              }}
            >
              {renderResourceIcon()}
            </span>
            {renderStatusBadge()}
          </div>
          <div>{renderSourceBadge()}</div>
        </div>

        {/* Title */}
        <h3
          id={`card-title-${point.key}`}
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--c-deep-ink)",
            marginBottom: "0.25rem",
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>

        {/* Landmark Location */}
        <p style={{ fontSize: "0.8125rem", color: "var(--c-text-secondary)", marginBottom: "0.625rem" }}>
          {point.payload.address_hint} · <strong style={{ color: "var(--c-deep-ink)" }}>{t.zones[point.zone]}</strong>
        </p>

        {/* Amenities Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.75rem" }}>
          {point.payload.amenities.map((amenity, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.6875rem",
                padding: "0.15rem 0.4rem",
                backgroundColor: "var(--c-sand-subtle)",
                borderRadius: "3px",
                color: "var(--c-text-primary)",
                border: "1px solid var(--c-border)",
              }}
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Observation Field Note & Expiry */}
        {obs ? (
          <div
            style={{
              padding: "0.625rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-sand-subtle)",
              border: "1px solid var(--c-border)",
              marginBottom: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", fontStyle: "italic", marginBottom: "0.375rem", color: "var(--c-deep-ink)" }}>
              "{obs.payload.observation_note}"
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.25rem",
                fontSize: "0.6875rem",
                color: "var(--c-text-muted)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={12} aria-hidden="true" />
                <span>
                  {t.card.lastConfirmed} {formatMinutesAgo(obs.observedAt)}
                </span>
              </span>
              <span className="mono tabular-nums" title={`Expires at block #${obs.expiresAt}`}>
                {t.card.expiresIn} {calculateRemainingLifetime(obs.expiresAt, 732950n)}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-sand-subtle)",
              fontSize: "0.75rem",
              color: "var(--c-text-secondary)",
              marginBottom: "0.75rem",
            }}
          >
            {t.card.noRecentObservation}
          </div>
        )}

        {/* Creator Provenance & Trust Signal */}
        <div
          style={{
            fontSize: "0.6875rem",
            color: "var(--c-text-muted)",
            borderTop: "1px solid var(--c-border)",
            paddingTop: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span>{t.card.creatorProvenance}:</span>
            <a
              href={`${TIRAMISU_EXPLORER}/address/${point.creator}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono"
              style={{ color: "var(--c-monsoon)", textDecoration: "none", fontWeight: 600 }}
              title={`View creator on Tiramisu Explorer: ${point.creator}`}
            >
              {point.creator.slice(0, 6)}…{point.creator.slice(-4)}
              <ExternalLink size={10} style={{ marginLeft: "3px", display: "inline" }} aria-hidden="true" />
            </a>
          </div>

          {/* Independent verification confidence score */}
          {challengesCount > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#9E261B", fontWeight: 700 }}>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Disputed status ({challengesCount} peer challenge reported)</span>
            </div>
          ) : confirmationsCount > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--c-leaf)", fontWeight: 700 }}>
              <ShieldCheck size={12} aria-hidden="true" />
              <span>
                Verified by {confirmationsCount} independent scout{confirmationsCount > 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <div style={{ color: "var(--c-text-muted)" }}>
              Awaiting second independent peer attestation
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons with accessible minimum 44px mobile height */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button
            onClick={() => onOpenReportModal(point)}
            className="btn-primary"
            style={{
              justifyContent: "center",
              fontSize: "0.75rem",
              padding: "0.45rem 0.5rem",
            }}
          >
            {t.card.reportStatus}
          </button>

          {obs ? (
            <button
              onClick={() => onOpenAttestModal(point)}
              className="btn-secondary"
              style={{
                justifyContent: "center",
                fontSize: "0.75rem",
                padding: "0.45rem 0.5rem",
              }}
            >
              {t.card.verifyOrChallenge}
            </button>
          ) : (
            <button
              onClick={() => onInspectEntity(point)}
              className="btn-secondary"
              style={{
                justifyContent: "center",
                fontSize: "0.75rem",
                padding: "0.45rem 0.5rem",
              }}
            >
              <FileCheck2 size={13} aria-hidden="true" />
              <span>{t.card.viewEvidence}</span>
            </button>
          )}
        </div>

        {obs && (
          <button
            onClick={() => onInspectEntity(point)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--c-monsoon)",
              fontSize: "0.75rem",
              textDecoration: "underline",
              cursor: "pointer",
              textAlign: "center",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              fontWeight: 600,
            }}
          >
            {t.card.viewEvidence}
          </button>
        )}
      </div>
    </article>
  );
};
