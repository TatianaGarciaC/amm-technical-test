/**
 * In-Memory Implementation of PurchaseRequestRepository
 * Used for local development and unit testing without AWS DynamoDB
 */

import type { PurchaseRequest } from "../../models/index.js";
import type { PurchaseRequestRepository } from "../types/purchaseRequestRepository.js";

/**
 * In-memory implementation of PurchaseRequestRepository
 * Stores requests in a Map for testing and local development
 */
export class InMemoryPurchaseRequestRepository
  implements PurchaseRequestRepository {
  private requests: Map<string, PurchaseRequest> = new Map();

  /**
   * Create a new purchase request in memory
   * @param request The purchase request to create
   * @returns The created purchase request
   */
  async create(request: PurchaseRequest): Promise<PurchaseRequest> {
    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Retrieve a purchase request by ID
   * @param id The request ID
   * @returns The purchase request or null if not found
   */
  async findById(id: string): Promise<PurchaseRequest | null> {
    return this.requests.get(id) ?? null;
  }

  /**
   * Retrieve all purchase requests
   * @returns Array of all purchase requests
   */
  async findAll(): Promise<PurchaseRequest[]> {
    return Array.from(this.requests.values());
  }

  /**
   * Update an existing purchase request
   * @param request The purchase request with updated data
   * @returns The updated purchase request
   * @throws Error if request ID does not exist
   */
  async update(request: PurchaseRequest): Promise<PurchaseRequest> {
    if (!this.requests.has(request.id)) {
      throw new Error(
        `Purchase request with ID ${request.id} not found for update`
      );
    }
    this.requests.set(request.id, request);
    return request;
  }
}
