import React, { useState } from "react";
import { ReliefPoint, AttestationVerdict } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { publishAttestation } from "../lib/arkivService";

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
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[locale];

  if (!isOpen || !point || !point.latestObservation) return null;

  const obs = point.latestObservation;

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

      await publishAttestation(provider, walletAddress, {
        reliefPointKey: point.key,
        observationKey: obs.key,
        verdict,
        reason: reason || (verdict === "confirm" ? "Verified usable in person" : "Disputed - facility not operating"),
      });

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error publishing attestation:", err);
      setErrorMessage(err.message || "Failed to submit attestation to Arkiv.");
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
      aria-labelledby="attest-modal-title"
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-main)",
        }}
      >
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
            <h3 id="attest-modal-title" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              {t.modals.attestTitle}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {point.payload.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMessage && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "4px",
                backgroundColor: "var(--color-heat-subtle)",
                color: "var(--color-heat)",
                fontSize: "0.8125rem",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Current Observation Summary */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-canvas)",
              border: "1px solid var(--border-main)",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
              Target Observation by {obs.creator.slice(0, 6)}…{obs.creator.slice(-4)}:
            </span>
            <p style={{ fontWeight: 600, marginTop: "0.25rem" }}>
              Status: {t.statuses[obs.status]} · "{obs.payload.observation_note}"
            </p>
          </div>

          {/* Verdict Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.375rem" }}>
              {t.modals.verdictLabel}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: verdict === "confirm" ? "2px solid var(--color-sage)" : "1px solid var(--border-main)",
                  backgroundColor: verdict === "confirm" ? "var(--color-sage-subtle)" : "var(--bg-canvas)",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="verdict"
                  value="confirm"
                  checked={verdict === "confirm"}
                  onChange={() => setVerdict("confirm")}
                />
                <CheckCircle size={16} color="var(--color-sage)" />
                <span>{t.modals.verdictConfirm}</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: verdict === "challenge" ? "2px solid var(--color-heat)" : "1px solid var(--border-main)",
                  backgroundColor: verdict === "challenge" ? "var(--color-heat-subtle)" : "var(--bg-canvas)",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="verdict"
                  value="challenge"
                  checked={verdict === "challenge"}
                  onChange={() => setVerdict("challenge")}
                />
                <AlertTriangle size={16} color="var(--color-heat)" />
                <span>{t.modals.verdictChallenge}</span>
              </label>
            </div>
          </div>

          {/* Reason Note */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              {t.modals.reasonLabel}
            </label>
            <input
              type="text"
              placeholder="e.g. Verified drinking water flow at 13:30 IST"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "0.375rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid var(--border-strong)",
                fontSize: "0.8125rem",
              }}
            />
          </div>

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
              {isSubmitting ? t.modals.signing : t.modals.submitAttestation}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
