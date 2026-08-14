import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { Approver } from "../../../models/index.js";
import { generateUUID } from "../../../utils/index.js";
import type { MailService } from "../types/MailService.js";
import type { MockMail } from "../models/MockMail.js";

export class DynamoDbMailService implements MailService {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async sendApprovalRequest(
    approver: Approver,
    purchaseRequestId: string,
    purchaseTitle: string,
    otp: string,
    approverAccessToken: string
  ): Promise<void> {
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
    const approvalLink = `${frontendBaseUrl}/approve?solicitud_id=${purchaseRequestId}&approver_token=${approverAccessToken}`;
    const mail: MockMail = {
      id: generateUUID(),
      to: approver.email,
      subject: `Solicitud de aprobación: ${purchaseTitle}`,
      body: [
        `Hola ${approver.name},`,
        "",
        `Título: ${purchaseTitle}`,
        `Solicitud ID: ${purchaseRequestId}`,
        "",
        "Enlace de aprobación:",
        approvalLink,
        "",
        `Código de verificación (OTP): ${otp}`,
        "Este código expirará en 3 minutos.",
      ].join("\n"),
      createdAt: new Date().toISOString(),
      purchaseRequestId,
      approverId: approver.id,
    };
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: mail }));
  }

  async findAll(): Promise<MockMail[]> {
    const response = await this.client.send(new ScanCommand({ TableName: this.tableName }));
    return (response.Items ?? []).map((item) => this.toMockMail(item));
  }

  async findById(id: string): Promise<MockMail | null> {
    const response = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { id },
    }));
    return response.Item ? this.toMockMail(response.Item) : null;
  }

  async findByPurchaseRequestId(purchaseRequestId: string): Promise<MockMail[]> {
    const response = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "purchaseRequestId = :requestId",
      ExpressionAttributeValues: { ":requestId": purchaseRequestId },
    }));
    return (response.Items ?? []).map((item) => this.toMockMail(item));
  }

  private toMockMail(item: Record<string, unknown>): MockMail {
    const fields = ["id", "to", "subject", "body", "createdAt", "purchaseRequestId", "approverId"] as const;
    for (const field of fields) {
      if (typeof item[field] !== "string") {
        throw new Error(`Invalid mock mail record: ${field} must be a string`);
      }
    }
    return {
      id: item.id as string,
      to: item.to as string,
      subject: item.subject as string,
      body: item.body as string,
      createdAt: item.createdAt as string,
      purchaseRequestId: item.purchaseRequestId as string,
      approverId: item.approverId as string,
    };
  }
}
