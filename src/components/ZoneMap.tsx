import React from "react";
import { PuneZone } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { MapPin } from "lucide-react";

interface ZoneMapProps {
  selectedZone: PuneZone;
  onSelectZone: (zone: PuneZone) => void;
  locale: Locale;
  pointCounts: Record<PuneZone, number>;
}

interface ZoneInfo {
  id: PuneZone;
  labelEn: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONES_LAYOUT: ZoneInfo[] = [
  { id: "hinjawadi", labelEn: "Hinjawadi", x: 30, y: 30, w: 140, h: 65 },
  { id: "shivajinagar", labelEn: "Shivajinagar", x: 190, y: 40, w: 150, h: 70 },
  { id: "yerawada", labelEn: "Yerawada", x: 360, y: 35, w: 140, h: 65 },
  { id: "kothrud", labelEn: "Kothrud", x: 40, y: 120, w: 130, h: 70 },
  { id: "deccan", labelEn: "Deccan Gymkhana", x: 190, y: 130, w: 150, h: 70 },
  { id: "hadapsar", labelEn: "Hadapsar", x: 360, y: 125, w: 140, h: 75 },
  { id: "swargate", labelEn: "Swargate", x: 190, y: 220, w: 150, h: 70 },
  { id: "katraj", labelEn: "Katraj", x: 190, y: 310, w: 150, h: 65 },
];

export const ZoneMap: React.FC<ZoneMapProps> = ({
  selectedZone,
  onSelectZone,
  locale,
  pointCounts,
}) => {
  const t = translations[locale];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-main)",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin size={18} color="var(--color-water)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {locale === "mr" ? "पुणे परिसर दिलासा नकाशा" : locale === "hi" ? "पुणे क्षेत्र राहत नक्शा" : "Pune Municipal Zone Grid"}
          </h2>
        </div>

        <button
          onClick={() => onSelectZone("all")}
          style={{
            fontSize: "0.8125rem",
            padding: "0.25rem 0.625rem",
            borderRadius: "4px",
            border: selectedZone === "all" ? "1px solid var(--color-water)" : "1px solid var(--border-strong)",
            backgroundColor: selectedZone === "all" ? "var(--color-water-subtle)" : "transparent",
            color: selectedZone === "all" ? "var(--color-water)" : "var(--text-muted)",
            fontWeight: 600,
            cursor: "pointer",
          }}
          aria-pressed={selectedZone === "all"}
        >
          {t.allZones} ({pointCounts["all"] || 0})
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.625rem",
        }}
      >
        {ZONES_LAYOUT.map((z) => {
          const isSelected = selectedZone === z.id;
          const count = pointCounts[z.id] || 0;
          const label = t.zones[z.id] || z.labelEn;

          return (
            <button
              key={z.id}
              onClick={() => onSelectZone(z.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.75rem",
                borderRadius: "6px",
                border: isSelected ? "2px solid var(--color-water)" : "1px solid var(--border-main)",
                backgroundColor: isSelected ? "var(--color-water-subtle)" : "var(--bg-canvas)",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s ease",
              }}
              aria-pressed={isSelected}
            >
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-ink)" }}>
                {label}
              </span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: "0.25rem",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>{count} {locale === "mr" ? "केंद्रे" : locale === "hi" ? "केंद्र" : "Points"}</span>
                {z.id === "hadapsar" && (
                  <span
                    style={{
                      backgroundColor: "var(--color-heat-subtle)",
                      color: "var(--color-heat)",
                      padding: "0 4px",
                      borderRadius: "3px",
                      fontWeight: 700,
                    }}
                  >
                    41.8°C
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
