/**
 * Domain types and enums for Purchase Request Management System
 */

/**
 * Possible states of a purchase request
 */
export enum PurchaseRequestStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

/**
 * Possible states of an approver's decision
 */
export enum ApproverStatus {
  PENDING = "PENDING",
  SIGNED = "SIGNED",
  REJECTED = "REJECTED",
}
