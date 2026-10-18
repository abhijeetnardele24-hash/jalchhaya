import React, { useState, useEffect, useRef } from "react";
import { ReliefPoint, AttestationVerdict } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { X, AlertCircle, CheckCircle2, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { publishAttestation, TxStep } from "../lib/arkivService";

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: ReliefPoint | null;
  walletAddress: `0x${string}` | null;
  locale: Locale;
  onSuccess: () => void;
}

export const AttestationModal: React.FC<AttestationModalProps> = ({
  isOpen,
  onClose,
  point,
  walletAddress,
  locale,
  onSuccess,
}) => {
  const [verdict, setVerdict] = useState<AttestationVerdict>("confirm");
  const [reason, setReason] = useState("verified_usable");
  const [note, setNote] = useState("");
  const [txStep, setTxStep] = useState<TxStep>("idle");
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

  if (!isOpen || !point || !point.latestObservation) return null;

  const obs = point.latestObservation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      await publishAttestation(
        provider,
        walletAddress,
        {
          reliefPointKey: point.key,
          observationKey: obs.key,
          verdict,
          reason,
          note,
        },
        (step) => setTxStep(step)
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error publishing attestation:", err);
      setErrorMessage(err.message || "Failed to sign or broadcast attestation to Arkiv Tiramisu.");
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
      aria-labelledby="attest-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="civic-card"
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 id="attest-modal-title" style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--c-deep-ink)" }}>
              {t.card.verifyOrChallenge}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--c-text-secondary)" }}>
              Attesting to report by <span className="mono">{obs.creator.slice(0, 6)}…{obs.creator.slice(-4)}</span>
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

        {/* Observation Reference Summary */}
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "4px",
            backgroundColor: "var(--c-sand-subtle)",
            border: "1px solid var(--c-border)",
            fontSize: "0.8125rem",
          }}
        >
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "var(--c-text-muted)" }}>
            Current Field Report Under Review
          </span>
          <p style={{ fontStyle: "italic", marginTop: "0.25rem", color: "var(--c-deep-ink)" }}>
            "{obs.payload.observation_note}"
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem", fontSize: "0.75rem" }}>
            <span>Status: <strong>{obs.status}</strong></span>
            {obs.payload.queue_depth_estimate && <span>· Queue: {obs.payload.queue_depth_estimate}</span>}
          </div>
        </div>

        {isSubmitting && (
          <div
            style={{
              padding: "0.625rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-water-subtle)",
              border: "1px solid rgba(8, 111, 131, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "var(--c-monsoon)",
              fontWeight: 600,
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Broadcasting peer attestation to Arkiv Tiramisu…</span>
          </div>
        )}

        {txStep === "confirmed" && (
          <div
            style={{
              padding: "0.625rem",
              borderRadius: "4px",
              backgroundColor: "var(--c-leaf-subtle)",
              color: "var(--c-leaf)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <CheckCircle2 size={16} />
            <span>Attestation confirmed! Confidence score updated on-chain.</span>
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
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Verdict Buttons */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.375rem", color: "var(--c-deep-ink)" }}>
              {t.modals.verdictLabel}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => { setVerdict("confirm"); setReason("verified_usable"); }}
                style={{
                  padding: "0.625rem",
                  borderRadius: "4px",
                  border: verdict === "confirm" ? "2px solid var(--c-leaf)" : "1px solid var(--c-border)",
                  backgroundColor: verdict === "confirm" ? "var(--c-leaf-subtle)" : "var(--c-paper)",
                  color: verdict === "confirm" ? "var(--c-leaf)" : "var(--c-text-primary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                }}
                aria-pressed={verdict === "confirm"}
              >
                <ShieldCheck size={16} />
                <span>{t.modals.verdictConfirm}</span>
              </button>

              <button
                type="button"
                onClick={() => { setVerdict("challenge"); setReason("disputed_condition"); }}
                style={{
                  padding: "0.625rem",
                  borderRadius: "4px",
                  border: verdict === "challenge" ? "2px solid var(--c-heat)" : "1px solid var(--c-border)",
                  backgroundColor: verdict === "challenge" ? "var(--c-heat-subtle)" : "var(--c-paper)",
                  color: verdict === "challenge" ? "#9E261B" : "var(--c-text-primary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                }}
                aria-pressed={verdict === "challenge"}
              >
                <ShieldAlert size={16} />
                <span>{t.modals.verdictChallenge}</span>
              </button>
            </div>
          </div>

          {/* Reason Code */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem", color: "var(--c-deep-ink)" }}>
              {t.modals.reasonLabel}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--c-border-strong)",
                backgroundColor: "var(--c-paper)",
                fontSize: "0.8125rem",
              }}
            >
              {verdict === "confirm" ? (
                <>
                  <option value="verified_usable">Verified Usable / Flowing Cleanly</option>
                  <option value="tank_refilled">Tank Recently Refilled</option>
                  <option value="clean_amenities">Clean Amenities Confirmed</option>
                </>
              ) : (
                <>
                  <option value="disputed_condition">Disputed Condition (Out of Water / Closed)</option>
                  <option value="severe_queue">Severe Queue Not Reported</option>
                  <option value="contaminated_or_warm">Water Contaminated or Hot</option>
                </>
              )}
            </select>
          </div>

          {/* Field Note */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem", color: "var(--c-deep-ink)" }}>
              {t.modals.noteLabel} (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. In-person verification during delivery shift"
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

          {/* Actions */}
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
              {isSubmitting ? t.modals.signing : t.modals.submitAttestation}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
