import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardErrorState, DashboardPage, matchesFilters } from "./DashboardPage";
import { listPurchaseRequests } from "../services/api";
import { pendingRequest } from "../test/fixtures";

vi.mock("../services/api", () => ({
  listPurchaseRequests: vi.fn(),
  userFacingError: () => "Unable to load purchase requests.",
}));

beforeEach(() => vi.mocked(listPurchaseRequests).mockReset());

describe("DashboardPage", () => {
  it("shows loading then request data, status, progress, and links", async () => {
    let resolveRequest!: (value: typeof pendingRequest[]) => void;
    vi.mocked(listPurchaseRequests).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading purchase requests");
    resolveRequest([pendingRequest]);
    expect(await screen.findByRole("heading", { name: pendingRequest.title })).toBeVisible();
    expect(within(screen.getByRole("heading", { name: pendingRequest.title }).closest("article")!).getByText("Pending")).toBeVisible();
    expect(screen.getByText("1 / 3 approvals")).toBeVisible();
    expect(screen.getByRole("link", { name: "New Purchase Request" })).toHaveAttribute("href", "/requests/new");
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute("href", `/requests/${pendingRequest.id}`);
  });

  it("shows an empty state", async () => {
    vi.mocked(listPurchaseRequests).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole("heading", { name: "No purchase requests yet" })).toBeVisible();
  });

  it("summarizes pending approvers as cancelled for a rejected request", async () => {
    vi.mocked(listPurchaseRequests).mockResolvedValue([{
      ...pendingRequest,
      status: "REJECTED",
      approvers: pendingRequest.approvers.map((approver, index) => ({ ...approver, status: index === 0 ? "REJECTED" : "PENDING" })) as typeof pendingRequest.approvers,
    }]);
    renderPage();
    expect(await screen.findByText("0 approved · 2 cancelled")).toBeVisible();
  });

  it("applies and clears combined filters and shows the filtered empty state", async () => {
    const user = userEvent.setup();
    vi.mocked(listPurchaseRequests).mockResolvedValue([pendingRequest, { ...pendingRequest, id: "completed-2", title: "Operational risks", requestedBy: "Lucas Valencia", status: "COMPLETED" }]);
    renderPage();
    await screen.findByText("2 results");
    await user.type(screen.getByLabelText("Search"), "missing");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("No results")).toBeVisible();
    expect(screen.getByRole("heading", { name: "No requests match these filters." })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("2 results")).toBeVisible();
  });

  it("shows a safe error state", async () => {
    render(<DashboardErrorState message="Unable to load purchase requests." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load purchase requests.");
  });
});

describe("dashboard filter matching", () => {
  const completed = { ...pendingRequest, id: "risk-ABC", title: "Operational Risks", description: "Cloud assessment", requestedBy: "Lucas Valencia", status: "COMPLETED" as const, createdAt: "2025-02-10T14:00:00.000Z" };
  const base = { search: "", status: "ALL" as const, requestedBy: "", dateFrom: "", dateTo: "" };

  it.each(["operational", "RISK", "abc", "cloud assess"])("matches partial case-insensitive text %s", (search) => {
    expect(matchesFilters(completed, { ...base, search })).toBe(true);
  });

  it.each([
    ["PENDING", pendingRequest, true], ["COMPLETED", completed, true], ["REJECTED", completed, false],
  ] as const)("filters status %s", (status, request, expected) => {
    expect(matchesFilters(request, { ...base, status })).toBe(expected);
  });

  it("filters requester, dates, and combined criteria with AND", () => {
    expect(matchesFilters(completed, { ...base, requestedBy: "lucas", dateFrom: "2025-02-10", dateTo: "2025-02-10", status: "COMPLETED", search: "risks" })).toBe(true);
    expect(matchesFilters(completed, { ...base, requestedBy: "other" })).toBe(false);
    expect(matchesFilters(completed, { ...base, dateFrom: "2025-02-11" })).toBe(false);
    expect(matchesFilters(completed, { ...base, dateTo: "2025-02-09" })).toBe(false);
  });
});

function renderPage() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}
