/**
 * Approver Response Mapper
 * Converts domain entities to approver-specific DTOs
 */

import type { PurchaseRequest, Approver } from "../../models/index.js";
import type {
  ApproverPurchaseRequestDTO,
  ApproverDetailDTO,
} from "../../models/approverDtos.js";

/**
 * Convert an Approver to a safe detail DTO
 */
export function approverToDetailDTO(approver: Approver): ApproverDetailDTO {
  return {
    id: approver.id,
    name: approver.name,
    email: approver.email,
    role: approver.role,
    status: approver.status,
  };
}

/**
 * Convert a PurchaseRequest to approver view after OTP validation
 * Shows the approver their own detail and summary of others
 */
export function purchaseRequestToApproverDTO(
  request: PurchaseRequest,
  approver: Approver
): ApproverPurchaseRequestDTO {
  return {
    requestId: request.id,
    title: request.title,
    description: request.description,
    amount: request.amount,
    createdAt: request.createdAt.toISOString(),
    requestedBy: request.requestedBy,
    approver: approverToDetailDTO(approver),
  };
}
