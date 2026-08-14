/**
 * Mail Service contract
 * Defines operations for sending emails
 */

import type { Approver } from "../../../models/index.js";
import type { MockMail } from "../models/MockMail.js";

/**
 * Interface for mail service operations
 */
export interface MailService {
  /**
   * Send an approval request email to an approver
   * @param approver The approver who needs to approve
   * @param purchaseRequestId The ID of the purchase request
   * @param purchaseTitle The title of the purchase request
   * @param otp The one-time password for verification
   * @param approverAccessToken The unique access token for this approver
   * @throws Error if sending fails
   */
  sendApprovalRequest(
    approver: Approver,
    purchaseRequestId: string,
    purchaseTitle: string,
    otp: string,
    approverAccessToken: string
  ): Promise<void>;

  findAll(): Promise<MockMail[]>;
  findById(id: string): Promise<MockMail | null>;
  findByPurchaseRequestId(purchaseRequestId: string): Promise<MockMail[]>;
}
