import { describe, expect, it } from "vitest";
import { generateOTP, generateUUID, calculateOTPExpiration } from "../src/utils/generators.js";
import {
  purchaseRequestFromPersistent,
  purchaseRequestToPersistent,
} from "../src/repositories/mappers/dateMapper.js";
import { purchaseRequestToApproverDTO } from "../src/repositories/mappers/approverMapper.js";
import { InMemoryPurchaseRequestRepository } from "../src/repositories/implementations/InMemoryPurchaseRequestRepository.js";
import { createRequest } from "./fixtures.js";

describe("generators", () => {
  it("generates UUIDs, six-digit OTPs, and an expiration near three minutes", () => {
    expect(generateUUID()).toMatch(/^[0-9a-f-]{36}$/i);
    expect(generateOTP()).toMatch(/^\d{6}$/);
    const before = Date.now();
    const expiration = calculateOTPExpiration().getTime();
    expect(expiration).toBeGreaterThanOrEqual(before + 179_000);
    expect(expiration).toBeLessThanOrEqual(before + 181_000);
  });
});

describe("mappers", () => {
  it("round-trips persistence dates and nullable decisions", async () => {
    const { request } = await createRequest();
    request.approvers[0].signedAt = new Date("2025-01-01T00:00:00.000Z");
    const persistent = purchaseRequestToPersistent(request);
    const restored = purchaseRequestFromPersistent(persistent);
    expect(typeof persistent.createdAt).toBe("string");
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.approvers[0].otpExpiresAt).toBeInstanceOf(Date);
    expect(restored.approvers[0].signedAt?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(restored.approvers[1].signedAt).toBeNull();
  });

  it("builds a safe approver DTO", async () => {
    const { request } = await createRequest();
    const dto = purchaseRequestToApproverDTO(request, request.approvers[0]);
    expect(dto.approver.name).toBe(request.approvers[0].name);
    expect(dto.approver).not.toHaveProperty("otp");
    expect(dto.approver).not.toHaveProperty("accessToken");
  });
});

describe("InMemoryPurchaseRequestRepository", () => {
  it("returns null for missing records and rejects updates to unknown records", async () => {
    const repository = new InMemoryPurchaseRequestRepository();
    expect(await repository.findById("missing")).toBeNull();
    expect(await repository.findAll()).toEqual([]);
    const { request } = await createRequest();
    await expect(repository.update(request)).rejects.toThrow("not found for update");
  });
});
