/**
 * Service for rejecting a purchase request
 */

import type { PurchaseRequestRepository } from "../../repositories/index.js";
import type { PurchaseRequestResponseDTO } from "../../models/index.js";
import { purchaseRequestToResponseDTO } from "../../repositories/mappers/responseMapper.js";
import { PurchaseRequestStatus, ApproverStatus } from "../../models/index.js";
import { ResolveApproverByTokenService } from "./ResolveApproverByTokenService.js";
import { validatePendingApproverOtp } from "./validatePendingApproverOtp.js";
import type { GenerateEvidenceService } from "../evidence/GenerateEvidenceService.js";

/**
 * DTO for reject action input
 */
export interface RejectInput {
  purchaseRequestId: string;
  approverToken: string;
  otp: string;
}

/**
 * Service for handling rejection of purchase requests
 */
export class RejectPurchaseRequestService {
  private readonly repository: PurchaseRequestRepository;
  private readonly resolver: ResolveApproverByTokenService;

  constructor(
    repository: PurchaseRequestRepository,
    private readonly evidenceService?: GenerateEvidenceService
  ) {
    this.repository = repository;
    this.resolver = new ResolveApproverByTokenService(repository);
  }

  /**
   * Reject a purchase request by an approver
   * @param input Rejection input with request ID, token, and OTP
   * @returns Updated request response DTO
   * @throws NotFoundError if request doesn't exist
   * @throws UnauthorizedError if token is invalid or OTP is wrong
   * @throws ExpiredOtpError if OTP has expired
   * @throws ConflictError if approver already decided or request is not PENDING
   */
  async execute(input: RejectInput): Promise<PurchaseRequestResponseDTO> {
    const now = new Date();
    const { request, approver } = await this.resolver.execute(input);
    validatePendingApproverOtp(approver, input.otp, now);

    // Step 8: Update approver status
    approver.status = ApproverStatus.REJECTED;
    approver.signedAt = now; // Using signedAt as "decidedAt" - technical debt

    // Step 9: Update request status to REJECTED
    request.status = PurchaseRequestStatus.REJECTED;

    // Step 10: Persist updated request
    const updated = await this.repository.update(request);

    if (this.evidenceService) {
      await this.evidenceService.execute(updated);
    }

    // Step 11: Return safe response
    return purchaseRequestToResponseDTO(updated);
  }
}
