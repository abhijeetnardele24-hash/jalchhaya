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
} from "lucide-react";
import { TIRAMISU_EXPLORER } from "../lib/arkivService";

interface ReliefCardProps {
  point: ReliefPoint;
  locale: Locale;
  onOpenReportModal: (point: ReliefPoint) => void;
  onOpenAttestModal: (point: ReliefPoint) => void;
  onInspectEntity: (point: ReliefPoint) => void;
}

export const ReliefCard: React.FC<ReliefCardProps> = ({
  point,
  locale,
  onOpenReportModal,
  onOpenAttestModal,
  onInspectEntity,
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

  // Icon selector
  const renderResourceIcon = () => {
    switch (point.resourceType) {
      case "water":
        return <Droplet size={18} color="var(--color-water)" />;
      case "shade":
        return <Umbrella size={18} color="var(--color-amber)" />;
      case "cooling_centre":
        return <Wind size={18} color="var(--color-sage)" />;
      case "first_aid_ors":
        return <HeartPulse size={18} color="var(--color-heat)" />;
      default:
        return <Droplet size={18} />;
    }
  };

  // Status visual indicator
  const renderStatusBadge = () => {
    if (!obs) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          <HelpCircle size={14} />
          <span>{locale === "mr" ? "अपुष्ट" : locale === "hi" ? "अपुष्ट" : "Unconfirmed"}</span>
        </span>
      );
    }

    if (obs.status === "available") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: "var(--color-sage-subtle)",
            color: "var(--color-sage)",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={14} />
          <span>{t.statuses.available}</span>
        </span>
      );
    }

    if (obs.status === "crowded") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            backgroundColor: "var(--color-amber-subtle)",
            color: "var(--color-amber)",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={14} />
          <span>{t.statuses.crowded}</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          backgroundColor: "var(--color-heat-subtle)",
          color: "var(--color-heat)",
          fontSize: "0.75rem",
          fontWeight: 700,
        }}
      >
        <XCircle size={14} />
        <span>{t.statuses.unavailable}</span>
      </span>
    );
  };

  // Human readable time
  const formatMinutesAgo = (timestampSeconds: number) => {
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() / 1000 - timestampSeconds) / 60));
    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m ago`;
    }
    const hours = Math.floor(elapsedMinutes / 60);
    return `${hours}h ${elapsedMinutes % 60}m ago`;
  };

  const confirmationsCount = point.attestations?.filter((a) => a.verdict === "confirm").length || 0;
  const challengesCount = point.attestations?.filter((a) => a.verdict === "challenge").length || 0;

  return (
    <article
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-main)",
        borderRadius: "8px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.15s ease",
      }}
    >
      <div>
        {/* Header row: Resource category + Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {renderResourceIcon()}
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-muted)",
              }}
            >
              {t.resourceTypes[point.resourceType]}
            </span>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--text-ink)",
            marginBottom: "0.25rem",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Location Hint */}
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          {point.payload.address_hint} · <strong style={{ color: "var(--text-ink)" }}>{t.zones[point.zone]}</strong>
        </p>

        {/* Amenities tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.75rem" }}>
          {point.payload.amenities.map((amenity, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.6875rem",
                padding: "0.125rem 0.375rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "3px",
                color: "var(--text-ink)",
                border: "1px solid var(--border-main)",
              }}
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Observation Status Note */}
        {obs ? (
          <div
            style={{
              padding: "0.625rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-canvas)",
              border: "1px solid var(--border-main)",
              marginBottom: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", fontStyle: "italic", marginBottom: "0.375rem" }}>
              "{obs.payload.observation_note}"
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={12} />
                <span>
                  {t.card.lastConfirmed} {formatMinutesAgo(obs.observedAt)}
                </span>
              </span>
              <span className="mono" title={`Expires at block #${obs.expiresAt}`}>
                {t.card.expiresIn} ~2h (Block #{obs.expiresAt.toString()})
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-subtle)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
            }}
          >
            {t.card.noRecentObservation}
          </div>
        )}

        {/* Immutable Cryptographic Provenance */}
        <div
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-light)",
            borderTop: "1px solid var(--border-main)",
            paddingTop: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.125rem" }}>
            <span>{t.card.creatorProvenance}:</span>
            <a
              href={`${TIRAMISU_EXPLORER}/address/${point.creator}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono"
              style={{ color: "var(--color-water)", textDecoration: "none" }}
            >
              {point.creator.slice(0, 6)}…{point.creator.slice(-4)}
              <ExternalLink size={10} style={{ marginLeft: "2px", display: "inline" }} />
            </a>
          </div>

          {/* Attestation trust signals */}
          {confirmationsCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-sage)" }}>
              <ShieldCheck size={12} />
              <span>
                {confirmationsCount} independent verification{confirmationsCount > 1 ? "s" : ""}
                {challengesCount > 0 ? ` · ${challengesCount} dispute` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}
      >
        <button
          onClick={() => onOpenReportModal(point)}
          style={{
            padding: "0.375rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid var(--color-water)",
            backgroundColor: "var(--color-water)",
            color: "#FFFFFF",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t.card.reportStatus}
        </button>

        {obs ? (
          <button
            onClick={() => onOpenAttestModal(point)}
            style={{
              padding: "0.375rem 0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-canvas)",
              color: "var(--text-ink)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.card.verifyOrChallenge}
          </button>
        ) : (
          <button
            onClick={() => onInspectEntity(point)}
            style={{
              padding: "0.375rem 0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-canvas)",
              color: "var(--text-ink)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.card.viewEvidence}
          </button>
        )}
      </div>

      {/* Direct link to Inspect details if button is occupied */}
      {obs && (
        <button
          onClick={() => onInspectEntity(point)}
          style={{
            marginTop: "0.375rem",
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--color-water)",
            fontSize: "0.6875rem",
            textDecoration: "underline",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {t.card.viewEvidence}
        </button>
      )}
    </article>
  );
};
