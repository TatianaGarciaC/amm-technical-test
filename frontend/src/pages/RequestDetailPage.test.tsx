import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestDetailPage } from "./RequestDetailPage";
import { getPurchaseRequest } from "../services/api";
import { completedRequest, pendingRequest } from "../test/fixtures";

vi.mock("../services/api", () => ({
  getPurchaseRequest: vi.fn(),
  downloadEvidence: vi.fn(),
  userFacingError: vi.fn(() => "Unable to load request."),
}));

beforeEach(() => vi.mocked(getPurchaseRequest).mockReset());

describe("RequestDetailPage", () => {
  it("loads principal data, three approvers, and their states", async () => {
    vi.mocked(getPurchaseRequest).mockResolvedValue(pendingRequest);
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading request details");
    expect(await screen.findByRole("heading", { name: pendingRequest.title })).toBeVisible();
    expect(screen.getByText(pendingRequest.description)).toBeVisible();
    expect(screen.getByText(pendingRequest.requestedBy)).toBeVisible();
    expect(screen.getByText("Carlos")).toBeVisible();
    expect(screen.getByText("Laura")).toBeVisible();
    expect(screen.getByText("Andres")).toBeVisible();
    expect(screen.getAllByText("Pending")).toHaveLength(3);
    expect(screen.getByText("Approved")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Download Evidence PDF" })).not.toBeInTheDocument();
  });

  it("shows evidence download for completed requests", async () => {
    vi.mocked(getPurchaseRequest).mockResolvedValue(completedRequest);
    renderPage();
    expect(await screen.findByText("Completed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Download Evidence PDF" })).toBeVisible();
  });

  it("shows evidence download for rejected requests and keeps undecided approvers cancelled visually", async () => {
    vi.mocked(getPurchaseRequest).mockResolvedValue({
      ...pendingRequest,
      status: "REJECTED",
      approvers: pendingRequest.approvers.map((approver, index) => ({ ...approver, status: index === 0 ? "REJECTED" : "PENDING" })) as typeof pendingRequest.approvers,
    });
    renderPage();
    expect(await screen.findAllByText("Rejected")).toHaveLength(2);
    expect(screen.getAllByText("Cancelled")).toHaveLength(2);
    expect(screen.getAllByText("Cancelled because the request was rejected.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Download Evidence PDF" })).toBeVisible();
  });
});

function renderPage() {
  return render(<MemoryRouter initialEntries={[`/requests/${pendingRequest.id}`]}><Routes>
    <Route path="/requests/:id" element={<RequestDetailPage />} />
  </Routes></MemoryRouter>);
}
