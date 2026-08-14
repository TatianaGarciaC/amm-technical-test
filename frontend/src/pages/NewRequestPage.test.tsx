import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewRequestPage } from "./NewRequestPage";
import { createPurchaseRequest } from "../services/api";
import { pendingRequest } from "../test/fixtures";

vi.mock("../services/api", () => ({
  createPurchaseRequest: vi.fn(),
  userFacingError: vi.fn(() => "Unable to create request."),
}));

beforeEach(() => vi.mocked(createPurchaseRequest).mockReset());

describe("NewRequestPage", () => {
  it("renders request fields and exactly three approver groups", () => {
    renderPage();
    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.getByLabelText("Description")).toBeVisible();
    expect(screen.getByLabelText("Amount")).toBeVisible();
    expect(screen.getByLabelText("Requested By")).toBeVisible();
    expect(screen.getAllByRole("group", { name: /Approver \d/ })).toHaveLength(3);
    expect(screen.getAllByLabelText("Email")).toHaveLength(3);
  });

  it("validates required fields and a positive amount", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Create Request" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Complete all request information fields");
    expect(screen.getByRole("alert")).toHaveTextContent("Amount must be greater than zero");
    expect(createPurchaseRequest).not.toHaveBeenCalled();
  });

  it("loads a complete test case without submitting and avoids an immediate repeat", async () => {
    const user = userEvent.setup();
    renderPage();
    const button = screen.getByRole("button", { name: "Load Test Data" });
    await user.click(button);
    const firstTitle = (screen.getByLabelText("Title") as HTMLInputElement).value;
    expect(firstTitle).not.toBe("");
    expect(screen.getByLabelText("Description")).not.toHaveValue("");
    expect(screen.getByLabelText("Amount")).not.toHaveValue(null);
    expect(screen.getByLabelText("Requested By")).not.toHaveValue("");
    expect(screen.getAllByLabelText("Name").every((input) => (input as HTMLInputElement).value !== "")).toBe(true);
    expect(createPurchaseRequest).not.toHaveBeenCalled();
    await user.click(button);
    expect(screen.getByLabelText("Title")).not.toHaveValue(firstTitle);
    expect(createPurchaseRequest).not.toHaveBeenCalled();
  });

  it("clears every form field without submitting", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Load Test Data" }));
    await user.click(screen.getByRole("button", { name: "Clear Form" }));
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Amount")).toHaveValue(null);
    expect(screen.getByLabelText("Requested By")).toHaveValue("");
    for (const input of [...screen.getAllByLabelText("Name"), ...screen.getAllByLabelText("Email"), ...screen.getAllByLabelText("Role")]) {
      expect(input).toHaveValue("");
    }
    expect(createPurchaseRequest).not.toHaveBeenCalled();
  });

  it("validates email and duplicate roles case-insensitively", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillMainFields(user);
    const names = screen.getAllByLabelText("Name");
    const emails = screen.getAllByLabelText("Email");
    const roles = screen.getAllByLabelText("Role");
    await fillApprover(user, names[0], emails[0], roles[0], "Carlos", "invalid", "Finance");
    await fillApprover(user, names[1], emails[1], roles[1], "Laura", "laura@example.com", " finance ");
    await fillApprover(user, names[2], emails[2], roles[2], "Andres", "andres@example.com", "Director");
    await user.click(screen.getByRole("button", { name: "Create Request" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email for approver 1");
    expect(screen.getByRole("alert")).toHaveTextContent("Approver roles must be different");
  });

  it("submits valid data, disables the button, and navigates to detail", async () => {
    const user = userEvent.setup();
    let resolveCreate!: (value: typeof pendingRequest) => void;
    vi.mocked(createPurchaseRequest).mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
    renderPage();
    await fillValidForm(user);
    const button = screen.getByRole("button", { name: "Create Request" });
    await user.click(button);
    expect(button).toBeDisabled();
    expect(createPurchaseRequest).toHaveBeenCalledWith(expect.objectContaining({ amount: 12500 }));
    resolveCreate(pendingRequest);
    expect(await screen.findByRole("heading", { name: "Detail destination" })).toBeVisible();
  });
});

function renderPage() {
  return render(<MemoryRouter initialEntries={["/requests/new"]}><Routes>
    <Route path="/requests/new" element={<NewRequestPage />} />
    <Route path="/requests/:id" element={<h1>Detail destination</h1>} />
  </Routes></MemoryRouter>);
}

async function fillMainFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Development laptops");
  await user.type(screen.getByLabelText("Description"), "Engineering equipment");
  await user.type(screen.getByLabelText("Amount"), "12500");
  await user.type(screen.getByLabelText("Requested By"), "Tatiana");
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await fillMainFields(user);
  const names = screen.getAllByLabelText("Name");
  const emails = screen.getAllByLabelText("Email");
  const roles = screen.getAllByLabelText("Role");
  await fillApprover(user, names[0], emails[0], roles[0], "Carlos", "carlos@example.com", "Finance");
  await fillApprover(user, names[1], emails[1], roles[1], "Laura", "laura@example.com", "Manager");
  await fillApprover(user, names[2], emails[2], roles[2], "Andres", "andres@example.com", "Director");
}

async function fillApprover(
  user: ReturnType<typeof userEvent.setup>,
  name: HTMLElement | undefined,
  email: HTMLElement | undefined,
  role: HTMLElement | undefined,
  nameValue: string,
  emailValue: string,
  roleValue: string
) {
  if (!name || !email || !role) throw new Error("Expected approver inputs");
  await user.type(name, nameValue);
  await user.type(email, emailValue);
  await user.type(role, roleValue);
}
