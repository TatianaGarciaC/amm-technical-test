/**
 * DynamoDB Implementation of PurchaseRequestRepository
 * Handles all persistence operations using AWS DynamoDB via DocumentClient
 */

import type {
  DynamoDBDocumentClient,
  PutCommandInput,
  GetCommandInput,
  ScanCommandInput,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import type { PurchaseRequest } from "../../models/index.js";
import type { PurchaseRequestRepository } from "../types/purchaseRequestRepository.js";
import type { PurchaseRequestPersistent } from "../mappers/dateMapper.js";
import {
  purchaseRequestToPersistent,
  purchaseRequestFromPersistent,
} from "../mappers/dateMapper.js";

/**
 * DynamoDB implementation of PurchaseRequestRepository
 * Uses DynamoDBDocumentClient for simplified attribute handling
 */
export class DynamoDbPurchaseRequestRepository implements PurchaseRequestRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(docClient: DynamoDBDocumentClient, tableName: string) {
    this.docClient = docClient;
    this.tableName = tableName;
  }

  /**
   * Create a new purchase request
   * @param request The purchase request to persist
   * @returns The created purchase request
   * @throws Error if DynamoDB operation fails
   */
  async create(request: PurchaseRequest): Promise<PurchaseRequest> {
    try {
      const persistent = purchaseRequestToPersistent(request);

      const command = new PutCommand({
        TableName: this.tableName,
        Item: persistent,
      } as PutCommandInput);

      await this.docClient.send(command);
      return request;
    } catch (error) {
      throw new Error(
        `Failed to create purchase request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve a purchase request by ID
   * @param id The request ID
   * @returns The purchase request or null if not found
   * @throws Error if DynamoDB operation fails
   */
  async findById(id: string): Promise<PurchaseRequest | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id,
        },
      } as GetCommandInput);

      const response = await this.docClient.send(command);

      if (!response.Item) {
        return null;
      }

      return purchaseRequestFromPersistent(
        response.Item as PurchaseRequestPersistent
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve purchase request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve all purchase requests
   * WARNING: This uses Scan which is inefficient for large tables.
   * For production, implement pagination and consider GSI queries.
   * @returns Array of all purchase requests
   * @throws Error if DynamoDB operation fails
   */
  async findAll(): Promise<PurchaseRequest[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
      } as ScanCommandInput);

      const response = await this.docClient.send(command);

      if (!response.Items) {
        return [];
      }

      return response.Items.map((item) =>
        purchaseRequestFromPersistent(item as PurchaseRequestPersistent)
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve all purchase requests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update an existing purchase request
   * Replaces the entire item in DynamoDB
   * @param request The purchase request with updated data
   * @returns The updated purchase request
   * @throws Error if DynamoDB operation fails
   */
  async update(request: PurchaseRequest): Promise<PurchaseRequest> {
    try {
      const persistent = purchaseRequestToPersistent(request);

      // Using PutCommand to replace the entire item
      // Alternative: Use UpdateCommand for partial updates (more efficient)
      const command = new PutCommand({
        TableName: this.tableName,
        Item: persistent,
      } as PutCommandInput);

      await this.docClient.send(command);
      return request;
    } catch (error) {
      throw new Error(
        `Failed to update purchase request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
