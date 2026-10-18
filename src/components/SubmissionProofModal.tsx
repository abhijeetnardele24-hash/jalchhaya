import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import {
  publishSubmissionDemoProof,
  arkivPublicClient,
  SUBMISSION_PROOF_WALLET,
  TIRAMISU_EXPLORER,
  TxStep,
} from "../lib/arkivService";

interface SubmissionProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: `0x${string}` | null;
}

export const SubmissionProofModal: React.FC<SubmissionProofModalProps> = ({ isOpen, onClose, walletAddress }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<TxStep>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [entityKey, setEntityKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const walletMatches = walletAddress?.toLowerCase() === SUBMISSION_PROOF_WALLET.toLowerCase();

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const createProof = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setTxHash("");
    setEntityKey("");
    setVerified(false);
    try {
      const provider = (window as Window & { ethereum?: unknown }).ethereum;
      if (!provider || !walletAddress) throw new Error("Connect the approved wallet before continuing.");
      const result = await publishSubmissionDemoProof(provider, walletAddress, (nextStep, hash, statusMessage) => {
        setStep(nextStep);
        if (hash) setTxHash(hash);
        if (statusMessage) setMessage(statusMessage);
      });
      setTxHash(result.txHash);
      setEntityKey(result.entityKey);
      setVerified(result.verified);
      setStep(result.verified ? "confirmed" : "confirming");
    } catch (cause) {
      setStep("failed");
      setError(cause instanceof Error ? cause.message : "The synthetic proof transaction could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const recheckEntity = async () => {
    if (!entityKey || busy) return;
    setBusy(true);
    setStep("querying_arkiv");
    setMessage("Checking the existing entity key again; no new transaction will be sent…");
    try {
      const entity = await arkivPublicClient.getEntity(entityKey as `0x${string}`);
      if (entity) {
        setVerified(true);
        setStep("confirmed");
        setMessage("Synthetic entity found on Arkiv and verified.");
      } else {
        setStep("confirming");
        setMessage("Arkiv has not indexed this entity yet. Check the explorer again shortly.");
      }
    } catch {
      setStep("confirming");
      setMessage("Arkiv lookup is temporarily unavailable. The transaction link remains available for verification.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: "1rem", background: "rgba(19,42,46,.62)", backdropFilter: "blur(3px)" }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-proof-title"
        className="civic-card"
        style={{ width: "min(100%, 560px)", maxHeight: "90vh", overflowY: "auto", padding: "clamp(1rem, 4vw, 1.5rem)", boxShadow: "var(--shadow-elevated)", outline: "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 8, color: "var(--c-monsoon)", background: "var(--c-water-subtle)" }}><ShieldCheck size={21} /></span>
            <div>
              <p style={{ color: "var(--c-monsoon)", fontSize: ".6875rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Arkiv protocol proof</p>
              <h2 id="submission-proof-title" style={{ color: "var(--c-deep-ink)", fontSize: "1.2rem", lineHeight: 1.25 }}>Create a synthetic testnet record</h2>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy} aria-label="Close proof dialog" style={{ padding: ".35rem" }}><X size={18} /></button>
        </div>

        <div style={{ marginTop: "1rem", padding: ".85rem 1rem", borderLeft: "3px solid var(--c-sun)", borderRadius: 4, background: "var(--c-sun-subtle)", color: "var(--c-text-secondary)", fontSize: ".84rem" }}>
          This is a public, one-day <strong>synthetic protocol demo only</strong>—not a real relief facility or service-availability report. It contains no location data and is separate from civic reports. Your wallet will show the testnet transaction for you to review.
        </div>

        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: ".45rem .75rem", margin: "1rem 0", fontSize: ".78rem", alignItems: "start" }}>
          <dt style={{ color: "var(--c-text-muted)" }}>Required wallet</dt><dd className="mono" style={{ overflowWrap: "anywhere", color: "var(--c-deep-ink)" }}>{SUBMISSION_PROOF_WALLET}</dd>
          <dt style={{ color: "var(--c-text-muted)" }}>Network</dt><dd style={{ color: "var(--c-deep-ink)" }}>Arkiv Tiramisu testnet · Chain 7738577</dd>
          <dt style={{ color: "var(--c-text-muted)" }}>Lifetime</dt><dd style={{ color: "var(--c-deep-ink)" }}>1 day · expires automatically</dd>
        </dl>

        {!walletAddress && <p role="status" style={{ marginBottom: ".75rem", color: "var(--c-text-secondary)", fontSize: ".82rem" }}>Connect the required wallet using the wallet control in the page header.</p>}
        {walletAddress && !walletMatches && <p role="alert" style={{ marginBottom: ".75rem", color: "#9E261B", fontSize: ".82rem", overflowWrap: "anywhere" }}>Connected address does not match the approved proof wallet: {walletAddress}</p>}
        {walletAddress && walletMatches && <p role="status" style={{ marginBottom: ".75rem", color: "var(--c-leaf)", fontSize: ".82rem", overflowWrap: "anywhere" }}>Approved wallet connected: {walletAddress}</p>}

        {busy && <div role="status" aria-live="polite" style={{ display: "flex", gap: ".5rem", alignItems: "center", padding: ".75rem", marginBottom: ".75rem", borderRadius: 5, background: "var(--c-water-subtle)", color: "var(--c-monsoon)", fontSize: ".82rem", fontWeight: 650 }}><Loader2 className="animate-spin" size={17} /><span>{message || "Working with Arkiv Tiramisu…"}</span></div>}
        {step === "confirmed" && verified && <div role="status" style={{ display: "flex", gap: ".5rem", alignItems: "center", padding: ".75rem", marginBottom: ".75rem", borderRadius: 5, background: "var(--c-leaf-subtle)", color: "var(--c-leaf)", fontSize: ".82rem", fontWeight: 700 }}><CheckCircle2 size={18} />Synthetic entity found on Arkiv and verified.</div>}
        {step === "confirming" && txHash && !verified && <div role="status" style={{ padding: ".75rem", marginBottom: ".75rem", borderRadius: 5, background: "var(--c-sun-subtle)", color: "var(--c-text-secondary)", fontSize: ".82rem" }}>Transaction was submitted, but entity lookup is still pending. Do not call it verified until the Arkiv explorer confirms it.</div>}
        {error && <div role="alert" style={{ display: "flex", gap: ".5rem", alignItems: "flex-start", padding: ".75rem", marginBottom: ".75rem", borderRadius: 5, background: "var(--c-heat-subtle)", color: "#9E261B", fontSize: ".82rem", overflowWrap: "anywhere" }}><AlertCircle size={17} style={{ flex: "0 0 auto" }} /><span>{error} {error.includes("faucet") && <a href="https://hub.arkiv.network/faucet" target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 700 }}>Open Arkiv faucet <ExternalLink size={12} /></a>}</span></div>}

        {txHash && <div style={{ display: "grid", gap: ".45rem", marginBottom: ".75rem", fontSize: ".78rem" }}>
          <a href={`${TIRAMISU_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" className="mono" style={{ color: "var(--c-monsoon)", overflowWrap: "anywhere" }}>Transaction: {txHash} <ExternalLink size={12} /></a>
          {entityKey && <p className="mono" style={{ overflowWrap: "anywhere", color: "var(--c-text-secondary)" }}>Entity: {entityKey}</p>}
        </div>}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: ".6rem", marginTop: "1rem" }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Close</button>
          {step === "confirming" && txHash && entityKey
            ? <button type="button" className="btn-primary" onClick={recheckEntity} disabled={busy}>Check verification status</button>
            : step !== "confirmed" && <button type="button" className="btn-primary" onClick={createProof} disabled={!walletMatches || busy}>
              {busy ? "Waiting for wallet…" : "Create synthetic testnet proof"}
            </button>}
        </div>
      </div>
    </div>
  );
};
