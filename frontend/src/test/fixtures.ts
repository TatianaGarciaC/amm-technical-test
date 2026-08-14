import type { ApproverPurchaseRequest, MockMail, PurchaseRequest } from "../types/api";

export const pendingRequest: PurchaseRequest = {
  id: "request-1",
  title: "Development laptops",
  description: "Laptops for the engineering team",
  amount: 12_500,
  createdAt: "2025-01-15T14:30:00.000Z",
  requestedBy: "Tatiana",
  status: "PENDING",
  approvers: [
    { id: "a1", name: "Carlos", email: "carlos@example.com", role: "FINANCE", status: "SIGNED", signedAt: "2025-01-15T15:00:00.000Z" },
    { id: "a2", name: "Laura", email: "laura@example.com", role: "MANAGER", status: "PENDING", signedAt: null },
    { id: "a3", name: "Andres", email: "andres@example.com", role: "DIRECTOR", status: "PENDING", signedAt: null },
  ],
};

export const completedRequest: PurchaseRequest = {
  ...pendingRequest,
  status: "COMPLETED",
  approvers: pendingRequest.approvers.map((approver) => ({
    ...approver,
    status: "SIGNED" as const,
    signedAt: approver.signedAt ?? "2025-01-15T16:00:00.000Z",
  })) as PurchaseRequest["approvers"],
};

export const approverDetail: ApproverPurchaseRequest = {
  requestId: pendingRequest.id,
  title: pendingRequest.title,
  description: pendingRequest.description,
  amount: pendingRequest.amount,
  createdAt: pendingRequest.createdAt,
  requestedBy: pendingRequest.requestedBy,
  approver: { id: "a2", name: "Laura", email: "laura@example.com", role: "MANAGER", status: "PENDING" },
};

export const mockMail: MockMail = {
  id: "mail-1",
  to: "laura@example.com",
  subject: "Purchase request approval",
  createdAt: "2025-01-15T14:31:00.000Z",
  purchaseRequestId: pendingRequest.id,
  approverId: "a2",
  body: "Verification code: 123456\nhttp://localhost:5173/approve?solicitud_id=request-1&approver_token=secret-token",
};
