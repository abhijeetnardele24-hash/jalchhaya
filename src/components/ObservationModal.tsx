import React, { useState, useEffect, useRef } from "react";
import { ReliefPoint, AvailabilityStatus } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { X, AlertCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { publishAvailabilityObservation, TxStep, TIRAMISU_EXPLORER } from "../lib/arkivService";

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
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const t = translations[locale];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !point) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("Cannot broadcast while offline. Offline mode provides read access to cached relief points, but new observations require an active network connection to reach Arkiv.");
      return;
    }
    if (!walletAddress) {
      setErrorMessage(t.noWalletInstalled);
      return;
    }

    setErrorMessage(null);
    setTxStep("preparing");

    try {
      const provider = (window as any).ethereum;
      if (!provider) {
        throw new Error(t.noWalletInstalled);
      }

      await publishAvailabilityObservation(
        provider,
        walletAddress,
        {
          reliefPointKey: point.key,
          zone: point.zone,
          resourceType: point.resourceType,
          status,
          severity,
          queueDepth,
          waterTemperature: waterTemp,
          note: note || (status === "available" ? "Dispenser confirmed functional" : "Out of service report"),
        },
        (step, hash, msg) => {
          setTxStep(step);
          if (hash) setTxHash(hash);
          if (msg) setStatusMessage(msg);
        }
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error publishing observation:", err);
      setErrorMessage(err.message || "Failed to sign or broadcast transaction to Arkiv Tiramisu.");
      setTxStep("failed");
    }
  };

  const isSubmitting = txStep === "preparing" || txStep === "prompting_wallet" || txStep === "broadcasting" || txStep === "confirming" || txStep === "querying_arkiv";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(19, 42, 46, 0.6)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="civic-card"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 id="report-modal-title" style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--c-deep-ink)" }}>
              {t.card.reportStatus}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--c-text-secondary)" }}>
              {point.payload.name} ({point.payload.address_hint})
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
            aria-label="Close Modal"
          >
            <X size={20} color="var(--c-deep-ink)" />
          </button>
        </div>

        {/* Transaction Step State Tracker */}
        {isSubmitting && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-water-subtle)",
              border: "1px solid rgba(8, 111, 131, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              color: "var(--c-monsoon)",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Loader2 size={16} className="animate-spin" />
              <span>{statusMessage || "Processing transaction on Arkiv Tiramisu…"}</span>
            </div>
            {txHash && (
              <a
                href={`${TIRAMISU_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{ color: "var(--c-monsoon)", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              >
                <span>View on Explorer: {txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {txStep === "confirmed" && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-leaf-subtle)",
              border: "1px solid rgba(56, 122, 98, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "var(--c-leaf)",
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={16} />
            <span>Confirmed on Arkiv Tiramisu! Synchronizing board…</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: "0.625rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-heat-subtle)",
              color: "#9E261B",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              border: "1px solid rgba(217, 93, 79, 0.4)",
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Status Segmented Select */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.375rem", color: "var(--c-deep-ink)" }}>
              {t.modals.statusLabel}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.375rem" }}>
              <button
                type="button"
                onClick={() => { setStatus("available"); setSeverity(1); }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: status === "available" ? "2px solid var(--c-leaf)" : "1px solid var(--c-border)",
                  backgroundColor: status === "available" ? "var(--c-leaf-subtle)" : "var(--c-paper)",
                  color: status === "available" ? "var(--c-leaf)" : "var(--c-text-primary)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                aria-pressed={status === "available"}
              >
                {t.statuses.available}
              </button>
              <button
                type="button"
                onClick={() => { setStatus("crowded"); setSeverity(2); }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: status === "crowded" ? "2px solid var(--c-sun)" : "1px solid var(--c-border)",
                  backgroundColor: status === "crowded" ? "var(--c-sun-subtle)" : "var(--c-paper)",
                  color: status === "crowded" ? "#8C560A" : "var(--c-text-primary)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                aria-pressed={status === "crowded"}
              >
                {t.statuses.crowded}
              </button>
              <button
                type="button"
                onClick={() => { setStatus("unavailable"); setSeverity(4); }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: status === "unavailable" ? "2px solid var(--c-heat)" : "1px solid var(--c-border)",
                  backgroundColor: status === "unavailable" ? "var(--c-heat-subtle)" : "var(--c-paper)",
                  color: status === "unavailable" ? "#9E261B" : "var(--c-text-primary)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                aria-pressed={status === "unavailable"}
              >
                {t.statuses.unavailable}
              </button>
            </div>
          </div>

          {/* Queue Depth */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem", color: "var(--c-deep-ink)" }}>
              {t.modals.queueLabel}
            </label>
            <input
              type="text"
              placeholder="e.g. 5 people, no wait"
              value={queueDepth}
              onChange={(e) => setQueueDepth(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--c-border-strong)",
                backgroundColor: "var(--c-paper)",
                fontSize: "0.8125rem",
              }}
            />
          </div>

          {/* Water Temperature / Coolness */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem", color: "var(--c-deep-ink)" }}>
              {t.modals.waterTempLabel}
            </label>
            <input
              type="text"
              placeholder="e.g. Cold pot water, ambient tap"
              value={waterTemp}
              onChange={(e) => setWaterTemp(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--c-border-strong)",
                backgroundColor: "var(--c-paper)",
                fontSize: "0.8125rem",
              }}
            />
          </div>

          {/* Field Note */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem", color: "var(--c-deep-ink)" }}>
              {t.modals.noteLabel}
            </label>
            <textarea
              rows={3}
              placeholder="e.g. In-person observation from field worker"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--c-border-strong)",
                backgroundColor: "var(--c-paper)",
                fontSize: "0.8125rem",
              }}
            />
          </div>

          {/* Privacy Minimizing Notice */}
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-sand-subtle)",
              border: "1px solid var(--c-border)",
              fontSize: "0.6875rem",
              color: "var(--c-text-secondary)",
            }}
          >
            Zero-PII Privacy Boundary: Do not include worker names, vehicle registrations, or phone numbers. All reports are immutably signed by your connected wallet and will expire automatically on-chain in 2 to 4 hours.
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              {t.modals.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? t.modals.signing : t.modals.submitReport}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
