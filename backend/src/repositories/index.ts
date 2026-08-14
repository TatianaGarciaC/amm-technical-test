/**
 * Repositories module - exports contracts and implementations
 */

// Export repository contract
export type { PurchaseRequestRepository } from "./types/purchaseRequestRepository.js";

// Export DynamoDB implementation
export { DynamoDbPurchaseRequestRepository } from "./implementations/DynamoDbPurchaseRequestRepository.js";

// Export in-memory implementation for testing and local development
export { InMemoryPurchaseRequestRepository } from "./implementations/InMemoryPurchaseRequestRepository.js";

// Export date mappers for manual serialization if needed
export {
  approverToPersistent,
  approverFromPersistent,
  purchaseRequestToPersistent,
  purchaseRequestFromPersistent,
  type ApproverPersistent,
  type PurchaseRequestPersistent,
} from "./mappers/dateMapper.js";

// Export response mappers
export {
  purchaseRequestToResponseDTO,
  approverToResponseDTO,
} from "./mappers/responseMapper.js";

// Export approver mappers
export {
  purchaseRequestToApproverDTO,
  approverToDetailDTO,
} from "./mappers/approverMapper.js";
