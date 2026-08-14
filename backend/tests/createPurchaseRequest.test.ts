import { describe, expect, it } from "vitest";
import { ApproverStatus, PurchaseRequestStatus } from "../src/models/index.js";
import { ValidationError } from "../src/errors/index.js";
import { purchaseRequestToResponseDTO } from "../src/repositories/mappers/responseMapper.js";
import { createTestContext, validInput } from "./fixtures.js";

describe("CreatePurchaseRequestService", () => {
  it("creates a pending request with three initialized approvers and mock mails", async () => {
    const before = Date.now();
    const { create, mail } = createTestContext();
    const request = await create.execute(validInput);
    const after = Date.now();

    expect(request.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(request.status).toBe(PurchaseRequestStatus.PENDING);
    expect(request.approvers).toHaveLength(3);
    expect(new Set(request.approvers.map((approver) => approver.role.toLowerCase())).size).toBe(3);
    for (const approver of request.approvers) {
      expect(approver.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(approver.accessToken).toMatch(/^[0-9a-f-]{36}$/i);
      expect(approver.otp).toMatch(/^\d{6}$/);
      expect(approver.status).toBe(ApproverStatus.PENDING);
      expect(approver.signedAt).toBeNull();
      expect(approver.otpExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 179_000);
      expect(approver.otpExpiresAt.getTime()).toBeLessThanOrEqual(after + 181_000);
    }
    expect(await mail.findAll()).toHaveLength(3);
  });

  it.each([
    ["an empty title", { ...validInput, title: " " }],
    ["a non-positive amount", { ...validInput, amount: 0 }],
    ["an invalid email", { ...validInput, approvers: [
      { ...validInput.approvers[0], email: "invalid" },
      validInput.approvers[1],
      validInput.approvers[2],
    ] }],
    ["duplicate roles ignoring case", { ...validInput, approvers: [
      validInput.approvers[0],
      { ...validInput.approvers[1], role: " finance " },
      validInput.approvers[2],
    ] }],
  ])("rejects %s", async (_label, input) => {
    const { create } = createTestContext();
    await expect(create.execute(input)).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects fewer or more than three approvers", async () => {
    const { create } = createTestContext();
    await expect(create.execute({ ...validInput, approvers: validInput.approvers.slice(0, 2) })).rejects.toBeInstanceOf(ValidationError);
    await expect(create.execute({ ...validInput, approvers: [...validInput.approvers, validInput.approvers[0]] })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("public response DTO", () => {
  it("does not expose OTP, access token, or OTP expiration", async () => {
    const { create } = createTestContext();
    const dto = purchaseRequestToResponseDTO(await create.execute(validInput));
    const root = dto as unknown as Record<string, unknown>;
    expect(root).not.toHaveProperty("otp");
    expect(root).not.toHaveProperty("accessToken");
    expect(root).not.toHaveProperty("otpExpiresAt");
    for (const approver of dto.approvers) {
      expect(approver).not.toHaveProperty("otp");
      expect(approver).not.toHaveProperty("accessToken");
      expect(approver).not.toHaveProperty("otpExpiresAt");
    }
  });
});
