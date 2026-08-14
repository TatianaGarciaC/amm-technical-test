/**
 * Service for creating a new purchase request
 */

import type {
  CreatePurchaseRequestDTO,
  PurchaseRequest,
} from "../models/index.js";
import { ApproverStatus, PurchaseRequestStatus } from "../models/index.js";
import type { PurchaseRequestRepository } from "../repositories/index.js";
import type { MailService } from "./mail/types/MailService.js";
import { validateCreatePurchaseRequestDTO } from "../validators/createPurchaseRequestValidator.js";
import {
  generateUUID,
  generateOTP,
  calculateOTPExpiration,
} from "../utils/generators.js";

/**
 * Service for handling purchase request creation
 */
export class CreatePurchaseRequestService {
  private readonly repository: PurchaseRequestRepository;
  private readonly mailService: MailService;

  constructor(repository: PurchaseRequestRepository, mailService: MailService) {
    this.repository = repository;
    this.mailService = mailService;
  }

  /**
   * Execute the create purchase request use case
   * @param dto Data transfer object with request details
   * @returns The created purchase request
   * @throws ValidationError if DTO is invalid
   * @throws Error if persistence or mail sending fails
   */
  async execute(dto: unknown): Promise<PurchaseRequest> {
    // Step 1: Validate DTO
    validateCreatePurchaseRequestDTO(dto);

    // Step 2: Get common creation timestamp
    const now = new Date();

    // Step 3: Generate UUID for request
    const requestId = generateUUID();

    // Step 4 & 5: Create three approvers with generated values
    const approvers = dto.approvers.map((approverDto: typeof dto.approvers[number]) => ({
      id: generateUUID(),
      name: approverDto.name,
      email: approverDto.email,
      role: approverDto.role,
      accessToken: generateUUID(),
      otp: generateOTP(),
      otpExpiresAt: calculateOTPExpiration(),
      status: ApproverStatus.PENDING,
      signedAt: null,
    }));

    // Step 6: Create PurchaseRequest
    const purchaseRequest: PurchaseRequest = {
      id: requestId,
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      createdAt: now,
      requestedBy: dto.requestedBy,
      status: PurchaseRequestStatus.PENDING,
      approvers: approvers as [typeof approvers[0], typeof approvers[1], typeof approvers[2]],
    };

    // Step 7: Persist
    const created = await this.repository.create(purchaseRequest);

    // Step 8: Send approval emails to each approver
    // Send exactly 3 emails, one per approver
    for (const approver of created.approvers) {
      await this.mailService.sendApprovalRequest(
        approver,
        created.id,
        created.title,
        approver.otp,
        approver.accessToken
      );
    }

    // Step 9: Return the created request
    return created;
  }
}
