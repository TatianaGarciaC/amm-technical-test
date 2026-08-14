import type { PurchaseRequest } from "../../models/index.js";
import { PurchaseRequestStatus } from "../../models/index.js";
import { ConflictError } from "../../errors/index.js";
import type { EvidenceFile } from "./models/EvidenceFile.js";
import type { EvidencePdfGenerator } from "./types/EvidencePdfGenerator.js";
import type { EvidenceStorage } from "./types/EvidenceStorage.js";

export class GenerateEvidenceService {
  constructor(
    private readonly generator: EvidencePdfGenerator,
    private readonly storage: EvidenceStorage
  ) {}

  async execute(request: PurchaseRequest): Promise<EvidenceFile> {
    if (![PurchaseRequestStatus.COMPLETED, PurchaseRequestStatus.REJECTED].includes(request.status)) {
      throw new ConflictError("Evidence can only be generated for a final request");
    }
    const pdf = await this.generator.generate(request);
    return this.storage.save(request.id, pdf);
  }
}
