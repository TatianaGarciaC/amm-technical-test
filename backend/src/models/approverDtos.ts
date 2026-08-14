/**
 * Approver-specific Response DTOs
 * These are returned to the approver after OTP validation
 */

/**
 * Safe representation of an Approver for display to that specific approver
 * No sensitive fields (otp, accessToken, otpExpiresAt)
 */
export interface ApproverDetailDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string; // PENDING | SIGNED | REJECTED
}

/**
 * Purchase request details shown to an approver after OTP validation
 * Excludes sensitive approver data but includes approver info relevant to the approver
 */
export interface ApproverPurchaseRequestDTO {
  requestId: string;
  title: string;
  description: string;
  amount: number;
  createdAt: string; // ISO-8601
  requestedBy: string;
  /** The approver viewing this request */
  approver: ApproverDetailDTO;
}
