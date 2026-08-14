import type { PurchaseRequest } from "../../../models/index.js";

/** Generates evidence bytes without knowing where they will be stored. */
export interface EvidencePdfGenerator {
  generate(request: PurchaseRequest): Promise<Buffer>;
}
