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
        backgroundColor: "var(--c-paper)",
        border: "1px solid var(--c-border)",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        marginBottom: "1.25rem",
        boxShadow: "var(--shadow-subtle)",
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
          <Radio size={15} color="var(--c-monsoon)" aria-hidden="true" />
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--c-deep-ink)" }}>
            {t.liveEvents.title}
          </h2>
        </div>
        <span
          className="mono"
          style={{
            fontSize: "0.6875rem",
            color: "var(--c-leaf)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Activity size={12} aria-hidden="true" />
          <span>{t.liveEvents.listening}</span>
        </span>
      </div>

      {/* Accessible keyboard-scrollable live region */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Recent on-chain block events"
        aria-live="polite"
        aria-atomic="true"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
          maxHeight: "120px",
          overflowY: "auto",
          paddingRight: "0.25rem",
        }}
      >
        {events.length === 0 ? (
          <p style={{ fontSize: "0.75rem", color: "var(--c-text-muted)", fontStyle: "italic" }}>
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
                borderRadius: "3px",
                backgroundColor: "var(--c-sand-subtle)",
                border: "1px solid var(--c-border)",
              }}
            >
              <div>
                <strong style={{ color: "var(--c-monsoon)" }}>{evt.type}</strong>
                <span className="mono" style={{ marginLeft: "0.375rem", color: "var(--c-text-secondary)" }}>
                  {evt.key.slice(0, 10)}…{evt.key.slice(-6)}
                </span>
              </div>
              <span className="tabular-nums" style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)" }}>
                {t.liveEvents.justNow}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
