import type { EvidenceFile } from "../models/EvidenceFile.js";

/** Storage boundary shared by local and cloud implementations. */
export interface EvidenceStorage {
  save(requestId: string, pdf: Buffer): Promise<EvidenceFile>;
  get(requestId: string): Promise<EvidenceFile | null>;
}
