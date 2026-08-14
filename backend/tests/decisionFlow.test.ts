import { describe, expect, it } from "vitest";
import { ApproverStatus, PurchaseRequestStatus } from "../src/models/index.js";
import { ConflictError } from "../src/errors/index.js";
import { ApprovePurchaseRequestService } from "../src/services/approver/ApprovePurchaseRequestService.js";
import { RejectPurchaseRequestService } from "../src/services/approver/RejectPurchaseRequestService.js";
import { GenerateEvidenceService } from "../src/services/evidence/GenerateEvidenceService.js";
import { InMemoryEvidenceStorage } from "../src/services/evidence/implementations/InMemoryEvidenceStorage.js";
import { PdfLibEvidencePdfGenerator } from "../src/services/evidence/implementations/PdfLibEvidencePdfGenerator.js";
import { createRequest } from "./fixtures.js";

describe("approval flow", () => {
  it("completes on the third signature and generates evidence once completed", async () => {
    const { request, repository } = await createRequest();
    const storage = new InMemoryEvidenceStorage();
    const approve = new ApprovePurchaseRequestService(
      repository,
      new GenerateEvidenceService(new PdfLibEvidencePdfGenerator(), storage)
    );

    const first = await approve.execute(credentials(request, 0));
    expect(first.approvers[0].status).toBe(ApproverStatus.SIGNED);
    expect(first.approvers[0].signedAt).not.toBeNull();
    expect(first.status).toBe(PurchaseRequestStatus.PENDING);
    expect(await storage.get(request.id)).toBeNull();

    const second = await approve.execute(credentials(request, 1));
    expect(second.approvers[1].status).toBe(ApproverStatus.SIGNED);
    expect(second.status).toBe(PurchaseRequestStatus.PENDING);
    expect(await storage.get(request.id)).toBeNull();

    const third = await approve.execute(credentials(request, 2));
    expect(third.approvers[2].status).toBe(ApproverStatus.SIGNED);
    expect(third.approvers[2].signedAt).not.toBeNull();
    expect(third.status).toBe(PurchaseRequestStatus.COMPLETED);
    expect(await storage.get(request.id)).not.toBeNull();
  });

  it("does not allow the same approver to approve twice", async () => {
    const { request, repository } = await createRequest();
    const approve = new ApprovePurchaseRequestService(repository);
    await approve.execute(credentials(request, 0));
    await expect(approve.execute(credentials(request, 0))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("rejection flow", () => {
  it("rejects immediately, preserves other pending approvers, generates evidence, and blocks later approval", async () => {
    const { request, repository } = await createRequest();
    const storage = new InMemoryEvidenceStorage();
    const evidence = new GenerateEvidenceService(new PdfLibEvidencePdfGenerator(), storage);
    const reject = new RejectPurchaseRequestService(repository, evidence);
    const approve = new ApprovePurchaseRequestService(repository, evidence);

    const result = await reject.execute(credentials(request, 0));
    expect(result.approvers[0].status).toBe(ApproverStatus.REJECTED);
    expect(result.approvers[0].signedAt).not.toBeNull();
    expect(result.approvers[1].status).toBe(ApproverStatus.PENDING);
    expect(result.approvers[2].status).toBe(ApproverStatus.PENDING);
    expect(result.status).toBe(PurchaseRequestStatus.REJECTED);
    expect(await storage.get(request.id)).not.toBeNull();
    await expect(approve.execute(credentials(request, 1))).rejects.toBeInstanceOf(ConflictError);
  });
});

function credentials(request: Awaited<ReturnType<typeof createRequest>>["request"], index: 0 | 1 | 2) {
  const approver = request.approvers[index];
  return { purchaseRequestId: request.id, approverToken: approver.accessToken, otp: approver.otp };
}
