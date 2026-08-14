/**
 * Service for validating an approver's OTP
 */

import type { PurchaseRequestRepository } from "../../repositories/index.js";
import type { ApproverPurchaseRequestDTO } from "../../models/index.js";
import { purchaseRequestToApproverDTO } from "../../repositories/mappers/approverMapper.js";
import { ResolveApproverByTokenService } from "./ResolveApproverByTokenService.js";
import { validatePendingApproverOtp } from "./validatePendingApproverOtp.js";

/**
 * DTO for OTP validation input
 */
export interface ValidateOtpInput {
  purchaseRequestId: string;
  approverToken: string;
  otp: string;
}

/**
 * Service for validating OTP and providing safe approver view
 */
export class ValidateApproverOtpService {
  private readonly resolver: ResolveApproverByTokenService;

  constructor(repository: PurchaseRequestRepository) {
    this.resolver = new ResolveApproverByTokenService(repository);
  }

  /**
   * Validate an approver's OTP
   * @param input Validation input
   * @returns Safe DTO for approver to view request details
   * @throws NotFoundError if request doesn't exist
   * @throws UnauthorizedError if token is invalid or OTP is wrong
   * @throws ExpiredOtpError if OTP has expired
   * @throws ConflictError if approver already decided or request is not PENDING
   */
  async execute(input: ValidateOtpInput): Promise<ApproverPurchaseRequestDTO> {
    const { request, approver } = await this.resolver.execute(input);
    validatePendingApproverOtp(approver, input.otp);
    return purchaseRequestToApproverDTO(request, approver);
  }
}
