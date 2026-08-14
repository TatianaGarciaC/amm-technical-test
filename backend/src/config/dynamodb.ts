/**
 * DynamoDB Configuration
 * Centralizes AWS SDK setup for DynamoDB client
 */

import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Creates and configures a DynamoDB Document Client
 * Uses AWS_REGION from environment or defaults to us-east-1 for development
 */
export function createDynamoDBClient(): DynamoDBDocumentClient {
  const region = process.env.AWS_REGION || "us-east-1";

  const clientConfig: DynamoDBClientConfig = {
    region,
  };

  const dynamoDBClient = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(dynamoDBClient);
}

/**
 * Gets the table name from environment variable
 * Must be configured in AWS_REGION environment variable for production
 * @throws Error if PURCHASE_REQUESTS_TABLE is not set in production
 */
export function getPurchaseRequestsTableName(): string {
  const tableName = process.env.PURCHASE_REQUESTS_TABLE;

  if (!tableName) {
    throw new Error(
      "PURCHASE_REQUESTS_TABLE environment variable is not set. " +
        "Please configure it in your environment."
    );
  }

  return tableName;
}
