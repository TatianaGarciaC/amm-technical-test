import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockMailPage } from "./MockMailPage";
import { getMockMails, listPurchaseRequests } from "../services/api";
import { pendingRequest } from "../test/fixtures";
import type { ApproverStatus, MockMail, PurchaseRequest, PurchaseRequestStatus } from "../types/api";
import { LanguageProvider } from "../i18n";

vi.mock("../services/api", () => ({
  getMockMails: vi.fn(),
  listPurchaseRequests: vi.fn(),
  userFacingError: vi.fn(() => "Unable to load demo mailbox."),
}));

const allPending: PurchaseRequest = {
  ...pendingRequest,
  approvers: pendingRequest.approvers.map((approver) => ({ ...approver, status: "PENDING", signedAt: null })) as PurchaseRequest["approvers"],
};

const mails: MockMail[] = allPending.approvers.map((approver, index) => ({
  id: `mail-${index + 1}`,
  to: approver.email,
  subject: `Approval required by ${approver.name}`,
  body: `Verification code: 12345${index}\nhttp://localhost:5173/approve?solicitud_id=${allPending.id}&approver_token=token-${index}`,
  createdAt: `2025-01-15T14:3${index}:00.000Z`,
  purchaseRequestId: allPending.id,
  approverId: approver.id,
}));

beforeEach(() => {
  vi.mocked(getMockMails).mockReset();
  vi.mocked(listPurchaseRequests).mockReset();
});

describe("MockMailPage", () => {
  it("groups three compact approver messages into one request card", async () => {
    mockMailbox(allPending);
    render(<MockMailPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Demo only");
    const group = await screen.findByRole("article", { name: `Purchase request ${allPending.title}` });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(within(group).getByText(`Request:`, { exact: false })).toHaveTextContent(allPending.id);
    expect(within(group).getByText("3 approval messages")).toBeVisible();
    expect(within(group).getAllByRole("region", { name: /approval message/ })).toHaveLength(3);
    expect(within(group).queryByText(/Verification code/)).not.toBeInTheDocument();
  });

  it("expands and contracts one email independently", async () => {
    const user = userEvent.setup();
    mockMailbox(allPending);
    render(<MockMailPage />);
    const viewButtons = await screen.findAllByRole("button", { name: "View Email" });
    await user.click(required(viewButtons[0]));
    expect(screen.getByText(/Verification code: 123450/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Hide Email" }));
    expect(screen.queryByText(/Verification code: 123450/)).not.toBeInTheDocument();
  });

  it("uses only the latest email when an approver has multiple messages", async () => {
    const user = userEvent.setup();
    const resent = { ...mails[0]!, id: "resent-mail", body: "Verification code: 999999", createdAt: "2025-01-15T15:00:00.000Z" };
    vi.mocked(getMockMails).mockResolvedValue([...mails, resent]);
    vi.mocked(listPurchaseRequests).mockResolvedValue([allPending]);
    render(<MockMailPage />);
    expect(await screen.findAllByRole("region", { name: /approval message/ })).toHaveLength(3);
    expect(screen.getByText(/2 messages/)).toBeVisible();
    await user.click(required((await screen.findAllByRole("button", { name: "View Email" }))[0]));
    expect(screen.getByText(/Verification code: 999999/)).toBeVisible();
    expect(screen.queryByText(/Verification code: 123450/)).not.toBeInTheDocument();
  });

  it("shows the rejecting approver as REJECTED and the other two as visually CANCELLED", async () => {
    const request = withStatuses("REJECTED", "REJECTED");
    mockMailbox(request);
    render(<MockMailPage />);
    const group = await screen.findByRole("article");
    expect(within(group).getAllByText("Rejected")).toHaveLength(2);
    expect(within(group).getAllByText("Cancelled")).toHaveLength(2);
    expect(screen.getAllByText("Cancelled because the request was rejected.")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Open Approval" })).not.toBeInTheDocument();
  });

  it.each([
    ["PENDING", "PENDING", "Open Approval"],
    ["PENDING", "SIGNED", "Approved"],
    ["PENDING", "REJECTED", "Rejected"],
    ["REJECTED", "PENDING", "Request closed"],
    ["COMPLETED", "SIGNED", "Request closed"],
  ] as const)("for request %s and approver %s shows %s", async (requestStatus, approverStatus, expected) => {
    const user = userEvent.setup();
    const request = withStatuses(requestStatus, approverStatus);
    mockMailbox(request);
    render(<MockMailPage />);
    await user.click(required((await screen.findAllByRole("button", { name: "View Email" }))[0]));
    expect(screen.getAllByText(expected)[0]).toBeVisible();
    if (expected !== "Open Approval") expect(screen.queryByRole("link", { name: "Open Approval" })).not.toBeInTheDocument();
  });

  it("sorts request groups newest first", async () => {
    const older = { ...allPending, id: "older", title: "Older request", createdAt: "2024-01-01T00:00:00.000Z" };
    const newer = { ...allPending, id: "newer", title: "Newer request", createdAt: "2026-01-01T00:00:00.000Z" };
    vi.mocked(getMockMails).mockResolvedValue([
      { ...mails[0]!, id: "old-mail", purchaseRequestId: older.id },
      { ...mails[0]!, id: "new-mail", purchaseRequestId: newer.id },
    ]);
    vi.mocked(listPurchaseRequests).mockResolvedValue([older, newer]);
    render(<MockMailPage />);
    const groups = await screen.findAllByRole("article");
    expect(groups[0]).toHaveAccessibleName("Purchase request Newer request");
  });

  it("shows an empty mailbox state", async () => {
    vi.mocked(getMockMails).mockResolvedValue([]);
    vi.mocked(listPurchaseRequests).mockResolvedValue([]);
    render(<MockMailPage />);
    expect(await screen.findByRole("heading", { name: "Mailbox is empty" })).toBeVisible();
  });

  it("paginates request groups in pages of five without splitting their approvers", async () => {
    const user = userEvent.setup();
    mockMany(7);
    render(<MockMailPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByText("Page 1 of 2")).toBeVisible();
    for (const group of screen.getAllByRole("article")) expect(within(group).getAllByRole("region", { name: /approval message/ })).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Page 2 of 2")).toBeVisible();
  });

  it("hides pagination when there are no more than five requests", async () => {
    mockMany(5);
    render(<MockMailPage />);
    expect(await screen.findAllByRole("article")).toHaveLength(5);
    expect(screen.queryByRole("navigation", { name: "Mailbox pagination" })).not.toBeInTheDocument();
  });

  it.each([
    ["Request 3", "Request 3"],
    ["request-3", "Request 3"],
    ["Carlos 3", "Request 3"],
    ["carlos3@example.com", "Request 3"],
  ])("searches the complete request by %s", async (query, expectedTitle) => {
    const user = userEvent.setup();
    mockMany(6);
    render(<MockMailPage />);
    await screen.findAllByRole("article");
    await user.type(screen.getByRole("textbox", { name: "Search" }), query.toUpperCase());
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: expectedTitle })).toBeVisible();
  });

  it.each([
    ["PENDING", "Request 1"],
    ["COMPLETED", "Request 2"],
    ["REJECTED", "Request 3"],
  ])("filters grouped requests by %s", async (status, expectedTitle) => {
    const user = userEvent.setup();
    mockMany(3);
    render(<MockMailPage />);
    await screen.findAllByRole("article");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), status);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: expectedTitle })).toBeVisible();
  });

  it.each([
    ["NEWEST", "Request 6"],
    ["OLDEST", "Request 1"],
    ["TITLE_ASC", "Request 1"],
    ["TITLE_DESC", "Request 6"],
  ])("sorts groups using %s", async (sort, firstTitle) => {
    const user = userEvent.setup();
    mockMany(6);
    render(<MockMailPage />);
    await screen.findAllByRole("article");
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), sort);
    expect(screen.getAllByRole("article")[0]).toHaveAccessibleName(`Purchase request ${firstTitle}`);
  });

  it("returns to page one when filtering and clear restores the initial state", async () => {
    const user = userEvent.setup();
    mockMany(7);
    render(<MockMailPage />);
    await screen.findAllByRole("article");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByRole("textbox", { name: "Search" }), "missing");
    expect(screen.getByRole("heading", { name: "No requests match these filters." })).toBeVisible();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
    expect(screen.getByText("Page 1 of 2")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("ALL");
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("NEWEST");
  });

  it("still expands and contracts the latest email after filtering", async () => {
    const user = userEvent.setup();
    mockMany(6);
    render(<MockMailPage />);
    await user.type(await screen.findByRole("textbox", { name: "Search" }), "Request 6");
    await user.click(screen.getAllByRole("button", { name: "View Email" })[0]!);
    expect(screen.getByText(/Verification code/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Hide Email" }));
    expect(screen.queryByText(/Verification code/)).not.toBeInTheDocument();
  });

  it("renders the new controls in Spanish", async () => {
    mockMany(1);
    render(<LanguageProvider initialLanguage="es"><MockMailPage /></LanguageProvider>);
    expect(await screen.findByPlaceholderText("Buscar por título, solicitante, correo o ID...")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Estado" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Ordenar por" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeDisabled();
  });
});

function mockMailbox(request: PurchaseRequest) {
  vi.mocked(getMockMails).mockResolvedValue(mails);
  vi.mocked(listPurchaseRequests).mockResolvedValue([request]);
}

function withStatuses(requestStatus: PurchaseRequestStatus, firstApproverStatus: ApproverStatus): PurchaseRequest {
  return {
    ...allPending,
    status: requestStatus,
    approvers: allPending.approvers.map((approver, index) => ({ ...approver, status: index === 0 ? firstApproverStatus : "PENDING" })) as PurchaseRequest["approvers"],
  };
}

function required<T>(value: T | undefined): T {
  if (!value) throw new Error("Expected test element");
  return value;
}

function mockMany(count: number) {
  const requests = Array.from({ length: count }, (_, index) => makeRequest(index + 1));
  const groupedMails = requests.flatMap((request) => request.approvers.map((approver, approverIndex) => ({
    id: `mail-${request.id}-${approver.id}`,
    to: approver.email,
    subject: `Approval required by ${approver.name}`,
    body: `Verification code: 12345${approverIndex}\nhttp://localhost:5173/approve?solicitud_id=${request.id}&approver_token=token-${approverIndex}`,
    createdAt: request.createdAt,
    purchaseRequestId: request.id,
    approverId: approver.id,
  })));
  vi.mocked(getMockMails).mockResolvedValue(groupedMails);
  vi.mocked(listPurchaseRequests).mockResolvedValue(requests);
}

function makeRequest(number: number): PurchaseRequest {
  const status = (["PENDING", "COMPLETED", "REJECTED"] as const)[(number - 1) % 3]!;
  return {
    ...allPending,
    id: `request-${number}`,
    title: `Request ${number}`,
    requestedBy: `Requester ${number}`,
    createdAt: `2025-01-${String(number).padStart(2, "0")}T12:00:00.000Z`,
    status,
    approvers: allPending.approvers.map((approver, index) => ({ ...approver, id: `${approver.id}-${number}`, name: `${approver.name} ${number}`, email: `${approver.name.toLowerCase()}${number}@example.com`, status: status === "COMPLETED" ? "SIGNED" : status === "REJECTED" && index === 0 ? "REJECTED" : "PENDING" })) as PurchaseRequest["approvers"],
  };
}
