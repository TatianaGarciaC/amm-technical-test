/**
 * Utility functions for generating secure identifiers and tokens
 */

import { randomUUID, randomInt } from "crypto";

/**
 * Generates a v4 UUID using Node.js crypto module
 * Used for:
 * - PurchaseRequest IDs
 * - Approver IDs
 * - Access tokens
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Generates a 6-digit numeric OTP
 * Uses crypto.randomInt for secure randomness
 * Can contain leading zeros (e.g., "004381")
 */
export function generateOTP(): string {
  // Generate a random number between 0 and 999999
  const otp = randomInt(1000000);
  // Pad with zeros to ensure 6 digits
  return otp.toString().padStart(6, "0");
}

/**
 * Calculates OTP expiration time (3 minutes from now)
 * @returns Date object representing expiration time
 */
export function calculateOTPExpiration(): Date {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes
  return expiresAt;
}
