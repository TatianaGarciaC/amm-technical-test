/**
 * PurchaseFlow
 * Versión: 1.0
 * Copyright © 2026 Tatiana Garcia Contreras
 */
import { ApproverStatus } from "../../models/index.js";
import type { PurchaseRequestRepository } from "../../repositories/index.js";
import type { MailService } from "../mail/types/MailService.js";
import { ConflictError } from "../../errors/index.js";
import { calculateOTPExpiration, generateOTP } from "../../utils/generators.js";
import { ResolveApproverByTokenService } from "./ResolveApproverByTokenService.js";

export interface ResendApproverOtpInput {
  purchaseRequestId: string;
  approverToken: string;
}

export interface ResendApproverOtpResult {
  message: "Verification code resent successfully.";
}

/** Reemplaza un OTP vencido, conserva el token de acceso y emite un nuevo correo demostrativo. */
export class ResendApproverOtpService {
  private readonly resolver: ResolveApproverByTokenService;

  constructor(
    private readonly repository: PurchaseRequestRepository,
    private readonly mailService: MailService,
  ) {
    this.resolver = new ResolveApproverByTokenService(repository);
  }

  async execute(input: ResendApproverOtpInput): Promise<ResendApproverOtpResult> {
    const { request, approver } = await this.resolver.execute(input);
    if (approver.status !== ApproverStatus.PENDING) {
      throw new ConflictError("Approver has already made a decision");
    }

    const previousOtp = approver.otp;
    let nextOtp = generateOTP();
    while (nextOtp === previousOtp) nextOtp = generateOTP();
    approver.otp = nextOtp;
    approver.otpExpiresAt = calculateOTPExpiration();

    await this.repository.update(request);
    await this.mailService.sendApprovalRequest(
      approver,
      request.id,
      request.title,
      nextOtp,
      approver.accessToken,
    );

    return { message: "Verification code resent successfully." };
  }
}
