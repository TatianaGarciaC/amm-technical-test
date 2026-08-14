import type { PurchaseRequestResponseDTO } from "../models/index.js";
import type { PurchaseRequestRepository } from "../repositories/index.js";
import { purchaseRequestToResponseDTO } from "../repositories/index.js";
import { NotFoundError } from "../errors/index.js";

export class GetPurchaseRequestService {
  constructor(private readonly repository: PurchaseRequestRepository) {}

  async execute(id: string): Promise<PurchaseRequestResponseDTO> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError("Purchase request not found");
    return purchaseRequestToResponseDTO(request);
  }
}
