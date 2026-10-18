import React from "react";
import { PuneZone, ReliefPoint } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { Navigation } from "lucide-react";

interface ZoneMapProps {
  selectedZone: PuneZone;
  onSelectZone: (zone: PuneZone) => void;
  locale: Locale;
  pointCounts: Record<PuneZone, number>;
  selectedPoint?: ReliefPoint | null;
}

interface ZoneInfo {
  id: PuneZone;
  labelEn: string;
  labelMr: string;
  labelHi: string;
  landmark: string;
  heatIndex: string;
  accent: string;
}

const PUNE_ATLAS_ZONES: ZoneInfo[] = [
  { id: "hinjawadi", labelEn: "Hinjawadi", labelMr: "हिंजवडी", labelHi: "हिंजवड़ी", landmark: "IT Hub / Shivaji Chowk", heatIndex: "39.2°C", accent: "var(--c-monsoon)" },
  { id: "shivajinagar", labelEn: "Shivajinagar", labelMr: "शिवाजीनगर", labelHi: "शिवाजीनगर", landmark: "Metro / Station Hub", heatIndex: "40.1°C", accent: "var(--c-monsoon)" },
  { id: "yerawada", labelEn: "Yerawada", labelMr: "येरवडा", labelHi: "यरवडा", landmark: "Ahmednagar Rd Corridor", heatIndex: "40.4°C", accent: "var(--c-monsoon)" },
  { id: "kothrud", labelEn: "Kothrud", labelMr: "कोथरूड", labelHi: "कोथरुड", landmark: "Karve Rd / Depot", heatIndex: "38.9°C", accent: "var(--c-leaf)" },
  { id: "deccan", labelEn: "Deccan Gymkhana", labelMr: "डेक्कन", labelHi: "डेक्कन", landmark: "PMT Bus Terminal Circle", heatIndex: "40.2°C", accent: "var(--c-monsoon)" },
  { id: "hadapsar", labelEn: "Hadapsar", labelMr: "हडपसर", labelHi: "हड़पसर", landmark: "Gadital Gig Worker Junction", heatIndex: "41.8°C", accent: "var(--c-heat)" },
  { id: "swargate", labelEn: "Swargate", labelMr: "स्वारगेट", labelHi: "स्वारगेट", landmark: "MSRTC State Transport Depot", heatIndex: "41.2°C", accent: "var(--c-heat)" },
  { id: "katraj", labelEn: "Katraj", labelMr: "कात्रज", labelHi: "कातरज", landmark: "Southern Ghat Entrance", heatIndex: "39.5°C", accent: "var(--c-leaf)" },
];

export const ZoneMap: React.FC<ZoneMapProps> = ({
  selectedZone,
  onSelectZone,
  locale,
  pointCounts,
  selectedPoint,
}) => {
  const t = translations[locale];

  return (
    <div
      className="civic-card"
      style={{
        padding: "1.25rem",
        marginBottom: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Atlas Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          borderBottom: "1px solid var(--c-border)",
          paddingBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Navigation size={18} color="var(--c-monsoon)" aria-hidden="true" />
          <div>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--c-deep-ink)" }}>
              {locale === "mr" ? "पुणे नागरी दिलासा नकाशा (Atlas)" : locale === "hi" ? "पुणे नागरिक राहत एटलस (Atlas)" : "Pune Civic Heat-Relief Atlas"}
            </h2>
            <p style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)" }}>
              Geohash-5 bounded transit hubs and municipal micro-climate stations
            </p>
          </div>
        </div>

        {/* All Zones Reset Button */}
        <button
          onClick={() => onSelectZone("all")}
          className="btn-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "0.35rem 0.625rem",
            backgroundColor: selectedZone === "all" ? "var(--c-sand)" : "transparent",
            borderColor: selectedZone === "all" ? "var(--c-monsoon)" : "var(--c-border-strong)",
            color: selectedZone === "all" ? "var(--c-monsoon)" : "var(--c-deep-ink)",
            fontWeight: selectedZone === "all" ? 800 : 600,
          }}
          aria-pressed={selectedZone === "all"}
        >
          {t.allZones} ({pointCounts["all"] || 0})
        </button>
      </div>

      {/* Spatial Schematic Grid (Simulating Geographic Layout of Pune) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
          gap: "0.625rem",
        }}
        role="region"
        aria-label="Pune Zone Geographic Selector"
      >
        {PUNE_ATLAS_ZONES.map((z) => {
          const isSelected = selectedZone === z.id;
          const count = pointCounts[z.id] || 0;
          const label = locale === "mr" ? z.labelMr : locale === "hi" ? z.labelHi : z.labelEn;

          return (
            <button
              key={z.id}
              onClick={() => onSelectZone(z.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.75rem",
                borderRadius: "4px",
                border: isSelected ? "2px solid var(--c-monsoon)" : "1px solid var(--c-border)",
                backgroundColor: isSelected ? "var(--c-water-subtle)" : "var(--c-paper)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all var(--motion-duration) var(--motion-easing)",
                boxShadow: isSelected ? "0 2px 6px rgba(8, 111, 131, 0.15)" : "none",
              }}
              aria-pressed={isSelected}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--c-deep-ink)" }}>
                  {label}
                </span>
                <span
                  className="mono tabular-nums"
                  style={{
                    fontSize: "0.625rem",
                    padding: "0.1rem 0.3rem",
                    borderRadius: "2px",
                    fontWeight: 700,
                    backgroundColor: z.id === "hadapsar" || z.id === "swargate" ? "var(--c-heat-subtle)" : "var(--c-sand-subtle)",
                    color: z.id === "hadapsar" || z.id === "swargate" ? "#9E261B" : "var(--c-text-secondary)",
                  }}
                  title="Zone peak ambient heat index"
                >
                  {z.heatIndex}
                </span>
              </div>

              <span style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)", marginTop: "0.2rem", lineHeight: 1.2 }}>
                {z.landmark}
              </span>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: "0.5rem",
                  fontSize: "0.6875rem",
                  color: isSelected ? "var(--c-monsoon)" : "var(--c-text-secondary)",
                  fontWeight: 600,
                }}
              >
                <span>{count} {locale === "mr" ? "केंद्रे" : locale === "hi" ? "केंद्र" : "Points"}</span>
                {isSelected && <span style={{ fontSize: "0.625rem", textTransform: "uppercase" }}>Active</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Facility Spotlight Callout (if a specific point is active) */}
      {selectedPoint && (
        <div
          style={{
            padding: "0.875rem",
            borderRadius: "4px",
            backgroundColor: "var(--c-sand-subtle)",
            border: "1px solid var(--c-border-strong)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--c-monsoon)" }}>
              Atlas Active Spotlight
            </span>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--c-deep-ink)" }}>
              {selectedPoint.payload.name}
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--c-text-secondary)" }}>
              {selectedPoint.payload.address_hint} · Geohash: <span className="mono">{selectedPoint.geohash5}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="badge badge-live">Verified Record</span>
          </div>
        </div>
      )}
    </div>
  );
};
