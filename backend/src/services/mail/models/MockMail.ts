/**
 * Model for simulated email messages
 */

/**
 * Represents a simulated (mock) email message
 * Used for development and testing without actual SMTP
 */
export interface MockMail {
  /** Unique identifier for the email */
  id: string;

  /** Recipient email address */
  to: string;

  /** Email subject */
  subject: string;

  /** Email body content */
  body: string;

  /** Timestamp when email was "created" (ISO-8601 string) */
  createdAt: string;

  /** Reference to the purchase request (for testing) */
  purchaseRequestId: string;

  /** Reference to the approver (for testing) */
  approverId: string;
}
