import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApprovePage } from "./ApprovePage";
import {
  ApiError,
  approvePurchaseRequest,
  getPurchaseRequest,
  rejectPurchaseRequest,
  resendApproverOtp,
  validateOtp,
} from "../services/api";
import { approverDetail, completedRequest, pendingRequest } from "../test/fixtures";

vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/api")>();
  return {
    ...actual,
    validateOtp: vi.fn(),
    approvePurchaseRequest: vi.fn(),
    getPurchaseRequest: vi.fn(),
    rejectPurchaseRequest: vi.fn(),
    resendApproverOtp: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(validateOtp).mockReset();
  vi.mocked(approvePurchaseRequest).mockReset();
  vi.mocked(rejectPurchaseRequest).mockReset();
  vi.mocked(getPurchaseRequest).mockReset();
  vi.mocked(getPurchaseRequest).mockResolvedValue(pendingRequest);
  vi.mocked(resendApproverOtp).mockReset();
});

describe("ApprovePage link and OTP flow", () => {
  it.each([
    "/approve?approver_token=token",
    "/approve?solicitud_id=request-1",
  ])("shows an invalid link when a query parameter is missing", (entry) => {
    renderPage(entry);
    expect(screen.getByRole("heading", { name: "Invalid approval link" })).toBeVisible();
  });

  it("offers resend after expiry, prevents duplicate clicks, and permits entering the new OTP", async () => {
    vi.mocked(validateOtp).mockRejectedValueOnce(new ApiError(410, "expired"));
    let resolveResend!: (value: { message: string }) => void;
    vi.mocked(resendApproverOtp).mockReturnValue(new Promise((resolve) => { resolveResend = resolve; }));
    const user = await verifyCode();
    expect(await screen.findByRole("heading", { name: "Verification code expired" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Demo Mailbox" })).toHaveAttribute("href", "/mock-mail");
    const resend = screen.getByRole("button", { name: "Resend OTP" });
    await user.click(resend);
    expect(resend).toBeDisabled();
    await user.click(resend);
    expect(resendApproverOtp).toHaveBeenCalledTimes(1);
    expect(resendApproverOtp).toHaveBeenCalledWith("request-1", "internal-token");
    resolveResend({ message: "Verification code resent successfully." });
    expect(await screen.findByRole("status")).toHaveTextContent("New verification code sent");
    const input = screen.getByLabelText("Verification code");
    await user.type(input, "654321");
    expect(input).toHaveValue("654321");
  });

  it("shows a numeric six-digit OTP form for a valid query", async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText("Verification code");
    await user.type(input, "12ab34567");
    expect(input).toHaveValue("123456");
    expect(screen.getByRole("button", { name: "Verify Code" })).toBeEnabled();
  });

  it("validates OTP and displays request and current approver details", async () => {
    vi.mocked(validateOtp).mockResolvedValue(approverDetail);
    await verifyCode();
    expect(validateOtp).toHaveBeenCalledWith("request-1", { approverToken: "internal-token", otp: "123456" });
    expect(await screen.findByRole("heading", { name: approverDetail.title })).toBeVisible();
    expect(screen.getByText(approverDetail.approver.name)).toBeVisible();
    expect(screen.getByRole("button", { name: "Approve" })).toBeVisible();
  });

  it.each([
    [401, "invalid"],
  ])("shows an understandable message for status %i", async (status, text) => {
    vi.mocked(validateOtp).mockRejectedValue(new ApiError(status, "technical"));
    await verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent(text);
  });

  it("replaces the OTP flow with a final screen when the request is already rejected", async () => {
    vi.mocked(getPurchaseRequest).mockResolvedValue({ ...pendingRequest, status: "REJECTED" });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Decision already recorded" })).toBeVisible();
    expect(screen.getByText(/already been rejected/)).toBeVisible();
    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("shows no decision actions when OTP validation reports an existing decision", async () => {
    vi.mocked(validateOtp).mockRejectedValue(new ApiError(409, "already processed"));
    await verifyCode();
    expect(await screen.findByRole("heading", { name: "Decision already recorded" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });
});

describe("ApprovePage decisions", () => {
  it("approves once and displays confirmation without further actions", async () => {
    vi.mocked(validateOtp).mockResolvedValue(approverDetail);
    vi.mocked(approvePurchaseRequest).mockResolvedValue(completedRequest);
    const user = await verifyCode();
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    expect(approvePurchaseRequest).toHaveBeenCalledWith("request-1", { approverToken: "internal-token", otp: "123456" });
    expect(await screen.findByRole("heading", { name: "Approval registered successfully." })).toBeVisible();
    expect(screen.getByText("Approved")).toHaveClass("status-approved");
    expect(screen.getByText("All approvals have been completed.")).toBeVisible();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("rejects only after positive confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(validateOtp).mockResolvedValue(approverDetail);
    vi.mocked(rejectPurchaseRequest).mockResolvedValue({ ...pendingRequest, status: "REJECTED" });
    const user = await verifyCode();
    await user.click(await screen.findByRole("button", { name: "Reject" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(rejectPurchaseRequest).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("heading", { name: "Rejection registered successfully." })).toBeVisible();
    expect(screen.getAllByText("Rejected")[0]).toHaveClass("status-rejected");
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });

  it("represents an intermediate approval as approved while explaining the global request remains pending", async () => {
    vi.mocked(validateOtp).mockResolvedValue(approverDetail);
    vi.mocked(approvePurchaseRequest).mockResolvedValue(pendingRequest);
    const user = await verifyCode();
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Approved")).toHaveClass("status-approved");
    expect(screen.getByText("The request is still pending other approvals.")).toBeVisible();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });

  it("does not reject when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(validateOtp).mockResolvedValue(approverDetail);
    const user = await verifyCode();
    await user.click(await screen.findByRole("button", { name: "Reject" }));
    expect(rejectPurchaseRequest).not.toHaveBeenCalled();
  });
});

async function verifyCode() {
  const user = userEvent.setup();
  renderPage();
  await user.type(await screen.findByLabelText("Verification code"), "123456");
  await user.click(screen.getByRole("button", { name: "Verify Code" }));
  return user;
}

function renderPage(entry = "/approve?solicitud_id=request-1&approver_token=internal-token") {
  return render(<MemoryRouter initialEntries={[entry]}><ApprovePage /></MemoryRouter>);
}
