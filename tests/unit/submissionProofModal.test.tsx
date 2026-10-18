import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SubmissionProofModal } from "../../src/components/SubmissionProofModal";
import { SUBMISSION_PROOF_WALLET } from "../../src/lib/arkivService";
import * as arkivService from "../../src/lib/arkivService";

vi.mock("../../src/lib/arkivService", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/arkivService")>();
  return {
    ...original,
    publishSubmissionDemoProof: vi.fn(),
    arkivPublicClient: { getEntity: vi.fn() },
  };
});

describe("SubmissionProofModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "ethereum", { configurable: true, value: { request: vi.fn() } });
  });

  it("requires the exact approved wallet before enabling a write", () => {
    render(<SubmissionProofModal isOpen onClose={onClose} walletAddress={null} />);
    expect(screen.getByText(/Connect the required wallet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create synthetic testnet proof/ })).toBeDisabled();
  });

  it("rejects a different connected account in the UI", () => {
    render(<SubmissionProofModal isOpen onClose={onClose} walletAddress={"0x0000000000000000000000000000000000000001"} />);
    expect(screen.getByRole("alert")).toHaveTextContent("does not match the approved proof wallet");
    expect(screen.getByRole("button", { name: /Create synthetic testnet proof/ })).toBeDisabled();
  });

  it("shows the explorer transaction and verified state only after the service confirms it", async () => {
    vi.mocked(arkivService.publishSubmissionDemoProof).mockResolvedValue({
      entityKey: `0x${"a".repeat(64)}`,
      txHash: `0x${"b".repeat(64)}`,
      expiresAt: 900n,
      verified: true,
    });
    render(<SubmissionProofModal isOpen onClose={onClose} walletAddress={SUBMISSION_PROOF_WALLET} />);

    fireEvent.click(screen.getByRole("button", { name: /Create synthetic testnet proof/ }));

    expect(await screen.findByText("Synthetic entity found on Arkiv and verified.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Transaction:/ })).toHaveAttribute(
      "href",
      `https://tiramisu.explorer.arkiv.network/tx/0x${"b".repeat(64)}`
    );
    expect(arkivService.publishSubmissionDemoProof).toHaveBeenCalledTimes(1);
  });

  it("allows rechecking a pending entity without sending a second transaction", async () => {
    vi.mocked(arkivService.publishSubmissionDemoProof).mockResolvedValue({
      entityKey: `0x${"a".repeat(64)}`,
      txHash: `0x${"b".repeat(64)}`,
      expiresAt: 900n,
      verified: false,
    });
    vi.mocked(arkivService.arkivPublicClient.getEntity).mockResolvedValue({ key: `0x${"a".repeat(64)}` } as never);
    render(<SubmissionProofModal isOpen onClose={onClose} walletAddress={SUBMISSION_PROOF_WALLET} />);

    fireEvent.click(screen.getByRole("button", { name: /Create synthetic testnet proof/ }));
    await screen.findByText(/still pending/);
    fireEvent.click(screen.getByRole("button", { name: /Check verification status/ }));

    await waitFor(() => expect(screen.getByText("Synthetic entity found on Arkiv and verified.")).toBeInTheDocument());
    expect(arkivService.publishSubmissionDemoProof).toHaveBeenCalledTimes(1);
  });

  it("surfaces a wallet/RPC failure without claiming success", async () => {
    vi.mocked(arkivService.publishSubmissionDemoProof).mockRejectedValue(new Error("Wallet signature rejected"));
    render(<SubmissionProofModal isOpen onClose={onClose} walletAddress={SUBMISSION_PROOF_WALLET} />);
    fireEvent.click(screen.getByRole("button", { name: /Create synthetic testnet proof/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wallet signature rejected");
    expect(screen.queryByText("Synthetic entity found on Arkiv and verified.")).not.toBeInTheDocument();
  });
});
