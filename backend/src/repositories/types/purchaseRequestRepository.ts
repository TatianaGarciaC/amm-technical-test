/**
 * Repository contract for Purchase Requests
 * Defines the interface for persistence operations
 * Decouples business logic from storage implementation (DynamoDB, in-memory, etc.)
 */

import type { PurchaseRequest } from "../../models/index.js";

/**
 * Interface for PurchaseRequest persistence operations
 * Implementations should handle all persistence concerns
 */
export interface PurchaseRequestRepository {
  /**
   * Create a new purchase request
   * @param request The purchase request to create
   * @returns The created purchase request
   * @throws Error if creation fails
   */
  create(request: PurchaseRequest): Promise<PurchaseRequest>;

  /**
   * Retrieve a purchase request by ID
   * @param id The request ID
   * @returns The purchase request or null if not found
   * @throws Error if retrieval fails
   */
  findById(id: string): Promise<PurchaseRequest | null>;

  /**
   * Retrieve all purchase requests
   * @returns Array of all purchase requests
   * @throws Error if retrieval fails
   */
  findAll(): Promise<PurchaseRequest[]>;

  /**
   * Update an existing purchase request
   * @param request The purchase request with updated data
   * @returns The updated purchase request
   * @throws Error if update fails
   */
  update(request: PurchaseRequest): Promise<PurchaseRequest>;
}
