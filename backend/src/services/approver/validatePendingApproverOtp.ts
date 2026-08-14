import type { Approver } from "../../models/index.js";
import { ApproverStatus } from "../../models/index.js";
import {
  ConflictError,
  ExpiredOtpError,
  UnauthorizedError,
} from "../../errors/index.js";

/** Applies the OTP and approver-state rules shared by all decision operations. */
export function validatePendingApproverOtp(
  approver: Approver,
  otp: string,
  now: Date = new Date()
): void {
  if (approver.status !== ApproverStatus.PENDING) {
    throw new ConflictError("Approver has already made a decision");
  }

  if (!/^\d{6}$/.test(otp) || otp !== approver.otp) {
    throw new UnauthorizedError("Invalid OTP");
  }

  if (now > approver.otpExpiresAt) {
    throw new ExpiredOtpError("OTP has expired");
  }
}
