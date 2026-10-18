import React, { useState } from "react";
import { ReliefPoint } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { X, Copy, Check, ExternalLink, Terminal, Database } from "lucide-react";
import { TIRAMISU_EXPLORER, TIRAMISU_HTTP_RPC } from "../lib/arkivService";

interface EvidenceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  point: ReliefPoint | null;
  locale: Locale;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  isOpen,
  onClose,
  point,
  locale,
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[locale];

  if (!isOpen || !point) return null;

  const obs = point.latestObservation;

  const sdkQueryCode = `// Reproducible Arkiv SDK Query for Entity ${point.key.slice(0, 10)}...
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { str, key } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";

const client = createPublicClient({
  chain: tiramisu,
  transport: http("${TIRAMISU_HTTP_RPC}")
});

// 1. Fetch exact relief point by key
const reliefPoint = await client.getEntity("${point.key}");
console.log("Relief Point:", reliefPoint.toJson());

// 2. Fetch all linked observations via compound query
const observations = await client
  .select({ key: true, creator: true, expiresAt: true, payload: true, attributes: true })
  .where(
    eq("project_id", str("${point.projectId}")),
    eq("entity_type", str("availability_observation")),
    eq("relief_point_key", key("${point.key}"))
  )
  .fetch();
console.log("Observations count:", observations.entities.length);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sdkQueryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28, 25, 23, 0.4)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-inspector-title"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "100%",
          backgroundColor: "var(--bg-card)",
          borderLeft: "1px solid var(--border-main)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--border-main)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Database size={18} color="var(--color-water)" />
              <h2 id="evidence-inspector-title" style={{ fontSize: "1.125rem", fontWeight: 800 }}>
                {t.evidenceInspector.title}
              </h2>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {t.evidenceInspector.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "4px",
            }}
            aria-label={t.evidenceInspector.close}
          >
            <X size={20} color="var(--text-ink)" />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Entity Key & Metadata Table */}
          <div
            style={{
              backgroundColor: "var(--bg-canvas)",
              border: "1px solid var(--border-main)",
              borderRadius: "6px",
              padding: "1rem",
            }}
          >
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Primary Relief Point Entity
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                  {t.evidenceInspector.entityKey}
                </span>
                <span className="mono" style={{ wordBreak: "break-all", fontWeight: 600 }}>
                  {point.key}
                </span>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                  {t.evidenceInspector.creatorWallet}
                </span>
                <a
                  href={`${TIRAMISU_EXPLORER}/address/${point.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{ color: "var(--color-water)", textDecoration: "none", wordBreak: "break-all" }}
                >
                  {point.creator} <ExternalLink size={12} style={{ display: "inline" }} />
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                    {t.evidenceInspector.creationBlock}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    #{point.createdAt.toString()}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                    {t.evidenceInspector.expirationBlock}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    #{point.expiresAt.toString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Availability Observation Entity */}
          {obs && (
            <div
              style={{
                backgroundColor: "var(--bg-canvas)",
                border: "1px solid var(--border-main)",
                borderRadius: "6px",
                padding: "1rem",
              }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                Linked Availability Observation Entity
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                    Observation Entity Key
                  </span>
                  <span className="mono" style={{ wordBreak: "break-all", fontWeight: 600 }}>
                    {obs.key}
                  </span>
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                    Observer Wallet ($creator)
                  </span>
                  <a
                    href={`${TIRAMISU_EXPLORER}/address/${obs.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono"
                    style={{ color: "var(--color-water)", textDecoration: "none", wordBreak: "break-all" }}
                  >
                    {obs.creator} <ExternalLink size={12} style={{ display: "inline" }} />
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                      Severity (i32)
                    </span>
                    <span className="mono" style={{ fontWeight: 600 }}>
                      Level {obs.severity} / 5
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.6875rem" }}>
                      Observed Expiration
                    </span>
                    <span className="mono" style={{ fontWeight: 600 }}>
                      #{obs.expiresAt.toString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typed Attributes Inspection */}
          <div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {t.evidenceInspector.typedAttributes}
            </h3>
            <pre
              className="mono"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#e6e6e6",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(
                {
                  project_id: { type: "str", value: point.projectId },
                  entity_type: { type: "str", value: point.entityType },
                  city: { type: "str", value: point.city },
                  zone: { type: "str", value: point.zone },
                  geohash5: { type: "str", value: point.geohash5 },
                  resource_type: { type: "str", value: point.resourceType },
                  accessibility: { type: "str", value: point.accessibility },
                  operator_class: { type: "str", value: point.operatorClass },
                  creation_flags: point.creationFlags,
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Decoded JSON Payload */}
          <div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {t.evidenceInspector.payloadData}
            </h3>
            <pre
              className="mono"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#e6e6e6",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(point.payload, null, 2)}
            </pre>
          </div>

          {/* Copyable Reproducible SDK Query */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Terminal size={16} color="var(--color-water)" />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  {t.evidenceInspector.sdkQueryTitle}
                </h3>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-canvas)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={12} color="var(--color-sage)" /> : <Copy size={12} />}
                <span>{copied ? t.evidenceInspector.copied : t.evidenceInspector.copyQuery}</span>
              </button>
            </div>

            <pre
              className="mono"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#9cdcfe",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.6875rem",
                overflowX: "auto",
                lineHeight: 1.4,
              }}
            >
              {sdkQueryCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
