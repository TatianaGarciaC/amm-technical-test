/**
 * Core domain entities for Purchase Request Management System
 */

import { PurchaseRequestStatus, ApproverStatus } from "./types.js";

/**
 * Internal domain model for an Approver
 * Contains all fields needed for business logic, including sensitive data
 * (tokens, OTP, etc. should NOT be exposed in API responses)
 */
export interface Approver {
  /** Unique identifier for the approver */
  id: string;

  /** Approver's full name */
  name: string;

  /** Approver's email address */
  email: string;

  /** Role/department of the approver (must be unique within a request) */
  role: string;

  /** Unique access token for this approver (generated server-side) */
  accessToken: string;

  /** One-time password for authentication (generated server-side) */
  otp: string;

  /** Timestamp when OTP expires */
  otpExpiresAt: Date;

  /** Current approval status (PENDING | SIGNED | REJECTED) */
  status: ApproverStatus;

  /** Timestamp when approver signed or rejected the request (nullable) */
  signedAt: Date | null;
}

/**
 * Internal domain model for a Purchase Request
 * Represents a complete purchase request with its three required approvers
 */
export interface PurchaseRequest {
  /** Unique identifier for the request */
  id: string;

  /** Title of the purchase request */
  title: string;

  /** Detailed description of the purchase */
  description: string;

  /** Amount in currency units */
  amount: number;

  /** Timestamp when the request was created (generated server-side) */
  createdAt: Date;

  /** Name or identifier of the person requesting the purchase */
  requestedBy: string;

  /** Current status of the request (PENDING | COMPLETED | REJECTED) */
  status: PurchaseRequestStatus;

  /** Exactly 3 approvers with different roles (enforced by business logic) */
  approvers: [Approver, Approver, Approver];
}
