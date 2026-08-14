import { beforeEach, describe, expect, it } from "vitest";
import { ApproverStatus, PurchaseRequestStatus, type PurchaseRequest } from "../src/models/index.js";
import { ConflictError, UnauthorizedError } from "../src/errors/index.js";
import { ResendApproverOtpService } from "../src/services/approver/ResendApproverOtpService.js";
import { ValidateApproverOtpService } from "../src/services/approver/ValidateApproverOtpService.js";
import { createRequest } from "./fixtures.js";
import type { InMemoryPurchaseRequestRepository } from "../src/repositories/implementations/InMemoryPurchaseRequestRepository.js";
import type { InMemoryMailService } from "../src/services/mail/implementations/InMemoryMailService.js";

describe("ResendApproverOtpService", () => {
  let request: PurchaseRequest;
  let repository: InMemoryPurchaseRequestRepository;
  let mail: InMemoryMailService;
  let service: ResendApproverOtpService;

  beforeEach(async () => {
    ({ request, repository, mail } = await createRequest());
    service = new ResendApproverOtpService(repository, mail);
  });

  it("replaces an expired OTP, renews expiration, keeps the token, and sends safe output and mail", async () => {
    const approver = request.approvers[0];
    const oldOtp = approver.otp;
    const oldToken = approver.accessToken;
    approver.otpExpiresAt = new Date(Date.now() - 1);
    const before = Date.now();

    const response = await service.execute({ purchaseRequestId: request.id, approverToken: oldToken });
    const stored = await repository.findById(request.id);
    const updated = stored?.approvers[0];
    expect(response).toEqual({ message: "Verification code resent successfully." });
    expect(response).not.toHaveProperty("otp");
    expect(response).not.toHaveProperty("accessToken");
    expect(response).not.toHaveProperty("otpExpiresAt");
    expect(updated?.otp).not.toBe(oldOtp);
    expect(updated?.accessToken).toBe(oldToken);
    expect(updated?.otpExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 179_000);
    expect(updated?.otpExpiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 181_000);
    const approverMails = (await mail.findByPurchaseRequestId(request.id)).filter((item) => item.approverId === approver.id);
    expect(approverMails).toHaveLength(2);
    expect(approverMails.at(-1)?.body).toContain(updated?.otp);

    const validate = new ValidateApproverOtpService(repository);
    await expect(validate.execute({ purchaseRequestId: request.id, approverToken: oldToken, otp: oldOtp })).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(validate.execute({ purchaseRequestId: request.id, approverToken: oldToken, otp: updated!.otp })).resolves.toMatchObject({ approver: { id: approver.id } });
  });

  it.each([ApproverStatus.SIGNED, ApproverStatus.REJECTED])("rejects resend after approver status %s", async (status) => {
    request.approvers[0].status = status;
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: request.approvers[0].accessToken })).rejects.toBeInstanceOf(ConflictError);
  });

  it.each([PurchaseRequestStatus.COMPLETED, PurchaseRequestStatus.REJECTED])("rejects resend after request status %s", async (status) => {
    request.status = status;
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: request.approvers[0].accessToken })).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an invalid token", async () => {
    await expect(service.execute({ purchaseRequestId: request.id, approverToken: "invalid" })).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
