/**
 * Service for approving a purchase request
 */

import type { PurchaseRequestRepository } from "../../repositories/index.js";
import type { PurchaseRequestResponseDTO } from "../../models/index.js";
import { purchaseRequestToResponseDTO } from "../../repositories/mappers/responseMapper.js";
import { PurchaseRequestStatus, ApproverStatus } from "../../models/index.js";
import { ResolveApproverByTokenService } from "./ResolveApproverByTokenService.js";
import { validatePendingApproverOtp } from "./validatePendingApproverOtp.js";
import type { GenerateEvidenceService } from "../evidence/GenerateEvidenceService.js";

/**
 * DTO for approve action input
 */
export interface ApproveInput {
  purchaseRequestId: string;
  approverToken: string;
  otp: string;
}

/**
 * Service for handling approval of purchase requests
 */
export class ApprovePurchaseRequestService {
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
   * Approve a purchase request by an approver
   * @param input Approval input with request ID, token, and OTP
   * @returns Updated request response DTO
   * @throws NotFoundError if request doesn't exist
   * @throws UnauthorizedError if token is invalid or OTP is wrong
   * @throws ExpiredOtpError if OTP has expired
   * @throws ConflictError if approver already decided or request is not PENDING
   */
  async execute(input: ApproveInput): Promise<PurchaseRequestResponseDTO> {
    const now = new Date();
    const { request, approver } = await this.resolver.execute(input);
    validatePendingApproverOtp(approver, input.otp, now);

    // Step 8: Update approver status
    approver.status = ApproverStatus.SIGNED;
    approver.signedAt = now;

    // Step 9: Check if all approvers are now signed
    const allSigned = request.approvers.every(
      (a) => a.status === ApproverStatus.SIGNED
    );

    if (allSigned) {
      request.status = PurchaseRequestStatus.COMPLETED;
    }

    // Step 10: Persist updated request
    const updated = await this.repository.update(request);

    if (allSigned && this.evidenceService) {
      await this.evidenceService.execute(updated);
    }

    // Step 11: Return safe response
    return purchaseRequestToResponseDTO(updated);
  }
}
