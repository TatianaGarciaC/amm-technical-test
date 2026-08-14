import type { PurchaseRequestResponseDTO } from "../models/index.js";
import type { PurchaseRequestRepository } from "../repositories/index.js";
import { purchaseRequestToResponseDTO } from "../repositories/index.js";

export class ListPurchaseRequestsService {
  constructor(private readonly repository: PurchaseRequestRepository) {}

  async execute(): Promise<PurchaseRequestResponseDTO[]> {
    const requests = await this.repository.findAll();
    return requests.map(purchaseRequestToResponseDTO);
  }
}
