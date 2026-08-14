/**
 * Data Transfer Objects (DTOs) for API input validation
 * These represent what clients can send to the API
 * Sensitive fields (IDs, tokens, OTP, status, timestamps) are NOT included
 */

/**
 * DTO for creating an approver via API
 * Clients provide basic information; server generates tokens, OTP, etc.
 */
export interface CreateApproverDTO {
  /** Approver's full name */
  name: string;

  /** Approver's email address */
  email: string;

  /** Role/department of the approver (must be unique within a request) */
  role: string;
}

/**
 * DTO for creating a purchase request via API
 * Clients provide the core request information and approver details
 * All IDs, tokens, OTP, status, and timestamps are generated server-side
 */
export interface CreatePurchaseRequestDTO {
  /** Title of the purchase request */
  title: string;

  /** Detailed description of the purchase */
  description: string;

  /** Amount in currency units */
  amount: number;

  /** Name or identifier of the person requesting the purchase */
  requestedBy: string;

  /** Exactly 3 approvers with different roles */
  approvers: [CreateApproverDTO, CreateApproverDTO, CreateApproverDTO];
}
