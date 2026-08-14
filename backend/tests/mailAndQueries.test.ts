import { describe, expect, it } from "vitest";
import { NotFoundError } from "../src/errors/index.js";
import { GetPurchaseRequestService } from "../src/services/GetPurchaseRequestService.js";
import { ListPurchaseRequestsService } from "../src/services/ListPurchaseRequestsService.js";
import { createRequest } from "./fixtures.js";

describe("InMemoryMailService", () => {
  it("stores sensitive mock content and supports request and approver lookups", async () => {
    const { request, mail } = await createRequest();
    const approver = request.approvers[0];
    const byRequest = await mail.findByPurchaseRequestId(request.id);
    const byApprover = await mail.findByApproverId(approver.id);
    expect(byRequest).toHaveLength(3);
    expect(byApprover).toHaveLength(1);
    expect(byApprover[0]?.body).toContain(approver.otp);
    expect(byApprover[0]?.body).toContain("/approve?");
    expect(await mail.findById(byApprover[0]?.id ?? "missing")).toEqual(byApprover[0]);
    expect(await mail.findById("missing")).toBeNull();
  });
});

describe("list and get services", () => {
  it("lists safe request DTOs and retrieves an existing request", async () => {
    const { request, repository } = await createRequest();
    const list = await new ListPurchaseRequestsService(repository).execute();
    const detail = await new GetPurchaseRequestService(repository).execute(request.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(request.id);
    expect(detail.id).toBe(request.id);
    expect(detail.approvers[0]).not.toHaveProperty("otp");
  });

  it("throws NotFoundError for a missing request", async () => {
    const { repository } = await createRequest();
    await expect(new GetPurchaseRequestService(repository).execute("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
