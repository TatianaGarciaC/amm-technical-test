/**
 * In-Memory Mock Mail Service Implementation
 * Stores simulated emails for testing and local development
 */

import type { Approver } from "../../../models/index.js";
import type { MailService } from "../types/MailService.js";
import type { MockMail } from "../models/MockMail.js";
import { generateUUID } from "../../../utils/generators.js";

/**
 * In-memory implementation of MailService
 * Stores emails in memory instead of sending via SMTP
 */
export class InMemoryMailService implements MailService {
  private mails: Map<string, MockMail> = new Map();

  /**
   * Send an approval request email to an approver
   * Stores the email in memory for later retrieval
   * @param approver The approver who needs to approve
   * @param purchaseRequestId The ID of the purchase request
   * @param purchaseTitle The title of the purchase request
   * @param otp The one-time password for verification
   * @param approverAccessToken The unique access token for this approver
   */
  async sendApprovalRequest(
    approver: Approver,
    purchaseRequestId: string,
    purchaseTitle: string,
    otp: string,
    approverAccessToken: string
  ): Promise<void> {
    const frontendBaseUrl =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173";

    // Build approval link
    const approvalLink = `${frontendBaseUrl}/approve?solicitud_id=${purchaseRequestId}&approver_token=${approverAccessToken}`;

    // Create email content
    const subject = `Solicitud de aprobación: ${purchaseTitle}`;
    const body = `
Hola ${approver.name},

Has sido seleccionado como aprobador para la siguiente solicitud de compra:

Título: ${purchaseTitle}
Solicitud ID: ${purchaseRequestId}

Para aprobar o rechazar esta solicitud, haz clic en el siguiente enlace:
${approvalLink}

Código de verificación (OTP): ${otp}

Este código expirará en 3 minutos.

Por favor, no compartas este enlace ni este código con nadie.

Saludos,
Sistema de Aprobación de Solicitudes
    `.trim();

    // Create mock email
    const mockMail: MockMail = {
      id: generateUUID(),
      to: approver.email,
      subject,
      body,
      createdAt: new Date().toISOString(),
      purchaseRequestId,
      approverId: approver.id,
    };

    // Store in memory
    this.mails.set(mockMail.id, mockMail);
  }

  /**
   * Retrieve all stored mock emails
   * Useful for testing and development
   */
  async findAll(): Promise<MockMail[]> {
    return Array.from(this.mails.values());
  }

  /**
   * Retrieve a specific mock email by ID
   * @param id The email ID
   * @returns The mock email or null if not found
   */
  async findById(id: string): Promise<MockMail | null> {
    return this.mails.get(id) ?? null;
  }

  /**
   * Retrieve all emails for a specific approver
   * Useful for testing individual approver flows
   * @param approverId The approver ID
   * @returns Array of emails for that approver
   */
  async findByApproverId(approverId: string): Promise<MockMail[]> {
    return Array.from(this.mails.values()).filter(
      (mail) => mail.approverId === approverId
    );
  }

  /**
   * Retrieve all emails for a specific purchase request
   * Useful for testing request-level flows
   * @param purchaseRequestId The purchase request ID
   * @returns Array of emails for that request
   */
  async findByPurchaseRequestId(
    purchaseRequestId: string
  ): Promise<MockMail[]> {
    return Array.from(this.mails.values()).filter(
      (mail) => mail.purchaseRequestId === purchaseRequestId
    );
  }
}
