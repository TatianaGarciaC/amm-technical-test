import type { ApproverStatus, PurchaseRequestStatus } from "../types/api";
import { useLanguage } from "../i18n";

export type ApproverVisualStatus = "APPROVED" | "REJECTED" | "PENDING" | "CANCELLED";

export function getApproverVisualStatus(status: ApproverStatus, requestStatus: PurchaseRequestStatus): ApproverVisualStatus {
  if (status === "SIGNED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  return requestStatus === "REJECTED" ? "CANCELLED" : "PENDING";
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const labels: Record<string, string> = { PENDING: t("statusPending"), SIGNED: t("statusApproved"), APPROVED: t("statusApproved"), REJECTED: t("statusRejected"), COMPLETED: t("statusCompleted"), CANCELLED: t("statusCancelled") };
  return <span className={`status-badge status-${status.toLowerCase()}`}>{labels[status] ?? status}</span>;
}

export function ApproverStatusBadge({ status, requestStatus }: { status: ApproverStatus; requestStatus: PurchaseRequestStatus }) {
  return <StatusBadge status={getApproverVisualStatus(status, requestStatus)} />;
}
