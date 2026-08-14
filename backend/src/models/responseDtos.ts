/**
 * Response DTOs for API responses
 * These represent data returned to clients
 * Exclude sensitive fields like OTP, accessToken, otpExpiresAt
 */

/**
 * Public representation of an Approver in API responses
 * No sensitive fields included
 */
export interface ApproverResponseDTO {
  /** Unique identifier for the approver */
  id: string;

  /** Approver's full name */
  name: string;

  /** Approver's email address */
  email: string;

  /** Role/department of the approver */
  role: string;

  /** Current approval status */
  status: string;

  /** Timestamp when approver signed or rejected (ISO-8601 string or null) */
  signedAt: string | null;
}

/**
 * Public representation of a Purchase Request in API responses
 * No sensitive fields (OTP, accessToken, otpExpiresAt) included
 */
export interface PurchaseRequestResponseDTO {
  /** Unique identifier for the request */
  id: string;

  /** Title of the purchase request */
  title: string;

  /** Detailed description of the purchase */
  description: string;

  /** Amount in currency units */
  amount: number;

  /** Timestamp when the request was created (ISO-8601 string) */
  createdAt: string;

  /** Name or identifier of the person requesting the purchase */
  requestedBy: string;

  /** Current status of the request */
  status: string;

  /** Approvers (without sensitive data) */
  approvers: [
    ApproverResponseDTO,
    ApproverResponseDTO,
    ApproverResponseDTO
  ];
}
