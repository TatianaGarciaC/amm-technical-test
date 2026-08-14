import type { PurchaseRequestStatus } from "../types/api";

export function isFinalStatus(status: PurchaseRequestStatus): boolean {
  return status === "COMPLETED" || status === "REJECTED";
}
