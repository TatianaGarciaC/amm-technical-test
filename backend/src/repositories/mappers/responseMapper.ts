/**
 * Response Mapper
 * Converts domain entities to public API response DTOs
 * Explicitly whitelists safe fields and excludes sensitive data
 */

import type {
  PurchaseRequest,
  Approver,
} from "../../models/index.js";
import type {
  PurchaseRequestResponseDTO,
  ApproverResponseDTO,
} from "../../models/responseDtos.js";

/**
 * Convert domain Approver to safe public response DTO
 * Excludes: otp, accessToken, otpExpiresAt
 */
export function approverToResponseDTO(approver: Approver): ApproverResponseDTO {
  return {
    id: approver.id,
    name: approver.name,
    email: approver.email,
    role: approver.role,
    status: approver.status,
    signedAt: approver.signedAt ? approver.signedAt.toISOString() : null,
  };
}

/**
 * Convert domain PurchaseRequest to safe public response DTO
 * Excludes sensitive data from approvers (otp, accessToken, otpExpiresAt)
 */
export function purchaseRequestToResponseDTO(
  request: PurchaseRequest
): PurchaseRequestResponseDTO {
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    amount: request.amount,
    createdAt: request.createdAt.toISOString(),
    requestedBy: request.requestedBy,
    status: request.status,
    approvers: request.approvers.map(approverToResponseDTO) as [
      ApproverResponseDTO,
      ApproverResponseDTO,
      ApproverResponseDTO
    ],
  };
}
