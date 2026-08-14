import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Layout } from "../components/Layout";
import { ApproverStatusBadge, StatusBadge } from "../components/StatusBadge";
import { LanguageProvider, useLanguage } from ".";

function DashboardCopy() {
  const { t } = useLanguage();
  return <><h1>{t("dashboardTitle")}</h1><StatusBadge status="PENDING" /><StatusBadge status="SIGNED" /><ApproverStatusBadge status="PENDING" requestStatus="REJECTED" /></>;
}

describe("language system", () => {
  it("defaults to Spanish and switches the complete visible shell to English and back", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><MemoryRouter><Routes><Route element={<Layout />}><Route index element={<DashboardCopy />} /></Route></Routes></MemoryRouter></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Solicitudes de compra" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Nueva solicitud" })).toBeVisible();
    expect(screen.getByText("Pendiente")).toBeVisible();
    expect(screen.getByText("Aprobado")).toBeVisible();
    expect(screen.getByText("Cancelado")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Inglés" }));
    expect(screen.getByRole("heading", { name: "Purchase Requests" })).toBeVisible();
    expect(screen.getByText("Pending")).toBeVisible();
    expect(screen.getByText("Approved")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Spanish" }));
    expect(screen.getByRole("heading", { name: "Solicitudes de compra" })).toBeVisible();
  });
});
