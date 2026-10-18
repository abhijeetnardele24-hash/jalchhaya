import React from "react";
import { Locale, translations } from "../i18n/translations";
import { Radio, Activity } from "lucide-react";

export interface LiveEventItem {
  id: string;
  type: string;
  key: string;
  timestamp: Date;
}

interface LiveEventsFeedProps {
  events: LiveEventItem[];
  locale: Locale;
}

export const LiveEventsFeed: React.FC<LiveEventsFeedProps> = ({ events, locale }) => {
  const t = translations[locale];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-main)",
        borderRadius: "8px",
        padding: "0.875rem 1rem",
        marginBottom: "1.5rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: events.length > 0 ? "0.5rem" : 0,
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Radio size={16} color="var(--color-water)" />
          <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.liveEvents.title}
          </h2>
        </div>
        <span
          className="mono"
          style={{
            fontSize: "0.6875rem",
            color: "var(--color-sage)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Activity size={12} />
          <span>{t.liveEvents.listening}</span>
        </span>
      </div>

      {/* Accessible live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
          maxHeight: "120px",
          overflowY: "auto",
        }}
      >
        {events.length === 0 ? (
          <p style={{ fontSize: "0.75rem", color: "var(--text-light)", fontStyle: "italic" }}>
            Listening for on-chain block events…
          </p>
        ) : (
          events.slice(0, 4).map((evt) => (
            <div
              key={evt.id}
              style={{
                fontSize: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: "var(--bg-subtle)",
              }}
            >
              <div>
                <strong style={{ color: "var(--color-water)" }}>{evt.type}</strong>
                <span className="mono" style={{ marginLeft: "0.375rem", color: "var(--text-muted)" }}>
                  {evt.key.slice(0, 10)}…{evt.key.slice(-6)}
                </span>
              </div>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-light)" }}>
                {t.liveEvents.justNow}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
