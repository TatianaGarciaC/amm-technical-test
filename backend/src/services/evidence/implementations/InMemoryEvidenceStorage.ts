import type { EvidenceFile } from "../models/EvidenceFile.js";
import type { EvidenceStorage } from "../types/EvidenceStorage.js";

export class InMemoryEvidenceStorage implements EvidenceStorage {
  private readonly files = new Map<string, EvidenceFile>();

  async save(requestId: string, pdf: Buffer): Promise<EvidenceFile> {
    const file: EvidenceFile = {
      requestId,
      fileName: `purchase-request-${requestId}-evidence.pdf`,
      contentType: "application/pdf",
      content: Buffer.from(pdf),
      storageKey: `evidence/${requestId}/evidence.pdf`,
    };
    this.files.set(requestId, file);
    return { ...file, content: Buffer.from(file.content) };
  }

  async get(requestId: string): Promise<EvidenceFile | null> {
    const file = this.files.get(requestId);
    return file ? { ...file, content: Buffer.from(file.content) } : null;
  }
}
