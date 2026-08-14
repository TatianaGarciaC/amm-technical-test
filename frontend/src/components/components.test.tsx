import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { Layout } from "./Layout";
import { StatusBadge } from "./StatusBadge";

describe("shared components", () => {
  it("renders status, accessible errors, and meaningful empty content", () => {
    render(<><StatusBadge status="SIGNED" /><ErrorMessage message="Unable to continue" /><EmptyState title="Nothing here">Create a request.</EmptyState></>);
    expect(screen.getByText("Approved")).toHaveClass("status-signed");
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to continue");
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeVisible();
  });

  it("renders primary navigation and nested page content", () => {
    render(<MemoryRouter><Routes><Route element={<Layout />}><Route index element={<h1>Dashboard content</h1>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByRole("link", { name: "PurchaseFlow home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New Request" })).toHaveAttribute("href", "/requests/new");
    expect(screen.getByRole("link", { name: "Demo Mailbox" })).toHaveAttribute("href", "/mock-mail");
    expect(screen.getByRole("heading", { name: "Dashboard content" })).toBeVisible();
  });
});
