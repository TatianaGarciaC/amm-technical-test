export type PurchaseRequestStatus = "PENDING" | "COMPLETED" | "REJECTED";
export type ApproverStatus = "PENDING" | "SIGNED" | "REJECTED";

export interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
  status: ApproverStatus;
  signedAt: string | null;
}

export interface PurchaseRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  createdAt: string;
  requestedBy: string;
  status: PurchaseRequestStatus;
  approvers: [Approver, Approver, Approver];
}

export interface CreateApproverInput {
  name: string;
  email: string;
  role: string;
}

export interface CreatePurchaseRequestInput {
  title: string;
  description: string;
  amount: number;
  requestedBy: string;
  approvers: [CreateApproverInput, CreateApproverInput, CreateApproverInput];
}

export interface ApproverPurchaseRequest {
  requestId: string;
  title: string;
  description: string;
  amount: number;
  createdAt: string;
  requestedBy: string;
  approver: Pick<Approver, "id" | "name" | "email" | "role" | "status">;
}

export interface ApproverCredentials {
  approverToken: string;
  otp: string;
}

export interface MockMail {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
  purchaseRequestId: string;
  approverId: string;
}
