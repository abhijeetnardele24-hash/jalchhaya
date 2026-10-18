import React, { useState } from "react";
import { ReliefPoint, AvailabilityStatus } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { X, AlertCircle } from "lucide-react";
import { publishAvailabilityObservation } from "../lib/arkivService";

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: ReliefPoint | null;
  walletAddress: `0x${string}` | null;
  locale: Locale;
  onSuccess: () => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  point,
  walletAddress,
  locale,
  onSuccess,
}) => {
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [severity, setSeverity] = useState<number>(1);
  const [queueDepth, setQueueDepth] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[locale];

  if (!isOpen || !point) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setErrorMessage(t.noWalletInstalled);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const provider = (window as any).ethereum;
      if (!provider) {
        throw new Error(t.noWalletInstalled);
      }

      await publishAvailabilityObservation(provider, walletAddress, {
        reliefPointKey: point.key,
        zone: point.zone,
        resourceType: point.resourceType,
        status,
        severity,
        queueDepth,
        waterTemperature: waterTemp,
        note: note || (status === "available" ? "Dispenser confirmed functional" : "Out of service report"),
      });

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error publishing observation:", err);
      setErrorMessage(err.message || "Failed to sign or broadcast transaction to Arkiv Tiramisu.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(28, 25, 23, 0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="obs-modal-title"
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-main)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-main)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 id="obs-modal-title" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              {t.modals.reportTitle}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {point.payload.name} ({t.zones[point.zone]})
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMessage && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "4px",
                backgroundColor: "var(--color-heat-subtle)",
                color: "var(--color-heat)",
                fontSize: "0.8125rem",
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.375rem" }}>
              {t.modals.statusLabel}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setStatus("available");
                  setSeverity(1);
                }}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: status === "available" ? "2px solid var(--color-sage)" : "1px solid var(--border-main)",
                  backgroundColor: status === "available" ? "var(--color-sage-subtle)" : "var(--bg-canvas)",
                  color: status === "available" ? "var(--color-sage)" : "var(--text-ink)",
                }}
              >
                {t.statuses.available}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus("crowded");
                  setSeverity(3);
                }}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: status === "crowded" ? "2px solid var(--color-amber)" : "1px solid var(--border-main)",
                  backgroundColor: status === "crowded" ? "var(--color-amber-subtle)" : "var(--bg-canvas)",
                  color: status === "crowded" ? "var(--color-amber)" : "var(--text-ink)",
                }}
              >
                {t.statuses.crowded}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus("unavailable");
                  setSeverity(5);
                }}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: status === "unavailable" ? "2px solid var(--color-heat)" : "1px solid var(--border-main)",
                  backgroundColor: status === "unavailable" ? "var(--color-heat-subtle)" : "var(--bg-canvas)",
                  color: status === "unavailable" ? "var(--color-heat)" : "var(--text-ink)",
                }}
              >
                {t.statuses.unavailable}
              </button>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {t.modals.severityLabel}: Level {severity} / 5
            </label>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
              {t.modals.severityHint}
            </p>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-water)" }}
            />
          </div>

          {/* Observation Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                {t.modals.waterTempLabel}
              </label>
              <input
                type="text"
                placeholder="e.g. Chilled / Working"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.375rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-strong)",
                  fontSize: "0.8125rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                {t.modals.queueLabel}
              </label>
              <input
                type="text"
                placeholder="e.g. 5-10 people"
                value={queueDepth}
                onChange={(e) => setQueueDepth(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.375rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-strong)",
                  fontSize: "0.8125rem",
                }}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              {t.modals.noteLabel}
            </label>
            <textarea
              rows={3}
              placeholder="Observation notes (keep non-personal: flow rate, cleanliness, shelter condition)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                padding: "0.375rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid var(--border-strong)",
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          {/* Privacy Disclaimer */}
          <p
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-subtle)",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--border-main)",
            }}
          >
            {t.modals.publicWarning}
          </p>

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid var(--border-strong)",
                backgroundColor: "transparent",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.modals.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid var(--color-water)",
                backgroundColor: "var(--color-water)",
                color: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? t.modals.signing : t.modals.submitReport}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
