import React from "react";
import { Incident } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { AlertTriangle, Clock } from "lucide-react";

interface IncidentBannerProps {
  incidents: Incident[];
  locale: Locale;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({ incidents, locale }) => {
  const t = translations[locale];

  if (!incidents || incidents.length === 0) return null;

  return (
    <aside
      aria-label={t.incidents.bannerTitle}
      style={{
        backgroundColor: "var(--c-heat-subtle)",
        border: "1px solid rgba(217, 93, 79, 0.4)",
        borderRadius: "6px",
        padding: "0.875rem 1rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <AlertTriangle size={18} color="#9E261B" aria-hidden="true" />
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#9E261B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {t.incidents.bannerTitle}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {incidents.map((incident) => (
          <div
            key={incident.key}
            style={{
              backgroundColor: "var(--c-paper)",
              padding: "0.625rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid rgba(217, 93, 79, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--c-deep-ink)" }}>
                {incident.payload.headline}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--c-text-secondary)", marginTop: "0.125rem" }}>
                {incident.payload.action_guidance}
              </p>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.6875rem",
                color: "#9E261B",
                fontWeight: 700,
              }}
            >
              <Clock size={12} aria-hidden="true" />
              <span>Severity {incident.severity}/5 Outage</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
