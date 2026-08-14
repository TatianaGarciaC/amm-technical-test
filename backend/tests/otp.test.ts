import { beforeEach, describe, expect, it } from "vitest";
import { ApproverStatus, PurchaseRequestStatus, type PurchaseRequest } from "../src/models/index.js";
import { ConflictError, ExpiredOtpError, NotFoundError, UnauthorizedError } from "../src/errors/index.js";
import { ValidateApproverOtpService } from "../src/services/approver/ValidateApproverOtpService.js";
import { createRequest } from "./fixtures.js";
import type { InMemoryPurchaseRequestRepository } from "../src/repositories/implementations/InMemoryPurchaseRequestRepository.js";

describe("ValidateApproverOtpService", () => {
  let request: PurchaseRequest;
  let repository: InMemoryPurchaseRequestRepository;
  let service: ValidateApproverOtpService;

  beforeEach(async () => {
    ({ request, repository } = await createRequest());
    service = new ValidateApproverOtpService(repository);
  });

  it("validates credentials and returns a safe approver detail", async () => {
    const approver = request.approvers[0];
    const detail = await service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: approver.otp });
    expect(detail.requestId).toBe(request.id);
    expect(detail.approver.id).toBe(approver.id);
    expect(detail.approver).not.toHaveProperty("otp");
    expect(detail.approver).not.toHaveProperty("accessToken");
    expect(detail.approver).not.toHaveProperty("otpExpiresAt");
  });

  it("rejects an incorrect or malformed OTP", async () => {
    const approver = request.approvers[0];
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: "00000" })).rejects.toBeInstanceOf(UnauthorizedError);
    const wrong = approver.otp === "000000" ? "999999" : "000000";
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: wrong })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects an expired OTP", async () => {
    const approver = request.approvers[0];
    approver.otpExpiresAt = new Date(Date.now() - 1);
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: approver.otp })).rejects.toBeInstanceOf(ExpiredOtpError);
  });

  it("rejects an invalid token and a missing request", async () => {
    const approver = request.approvers[0];
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: "invalid", otp: approver.otp })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(service.execute({ purchaseRequestId: "missing", approverToken: approver.accessToken, otp: approver.otp })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a finished request", async () => {
    const approver = request.approvers[0];
    request.status = PurchaseRequestStatus.REJECTED;
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: approver.otp })).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an approver who already decided", async () => {
    const approver = request.approvers[0];
    approver.status = ApproverStatus.SIGNED;
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: approver.accessToken, otp: approver.otp })).rejects.toBeInstanceOf(ConflictError);
  });
});
