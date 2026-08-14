import type { Approver, PurchaseRequest } from "../../models/index.js";
import { PurchaseRequestStatus } from "../../models/index.js";
import type { PurchaseRequestRepository } from "../../repositories/index.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/index.js";

export interface ResolveApproverInput {
  purchaseRequestId: string;
  approverToken: string;
}

/** Internal result. It must never be returned directly by an API. */
export interface ResolvedApprover {
  request: PurchaseRequest;
  approver: Approver;
}

/** Resolves the request and its approver while enforcing the request lifecycle. */
export class ResolveApproverByTokenService {
  constructor(private readonly repository: PurchaseRequestRepository) {}

  async execute(input: ResolveApproverInput): Promise<ResolvedApprover> {
    const request = await this.repository.findById(input.purchaseRequestId);

    if (!request) {
      throw new NotFoundError("Purchase request not found");
    }

    const approver = request.approvers.find(
      (candidate) => candidate.accessToken === input.approverToken
    );

    if (!approver) {
      throw new UnauthorizedError("Invalid access token");
    }

    if (request.status !== PurchaseRequestStatus.PENDING) {
      throw new ConflictError("Purchase request has already finished");
    }

    return { request, approver };
  }
}
