import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { ApproverStatus, PurchaseRequestStatus } from "../src/models/index.js";
import { ConflictError } from "../src/errors/index.js";
import { PdfLibEvidencePdfGenerator } from "../src/services/evidence/implementations/PdfLibEvidencePdfGenerator.js";
import { InMemoryEvidenceStorage } from "../src/services/evidence/implementations/InMemoryEvidenceStorage.js";
import { GenerateEvidenceService } from "../src/services/evidence/GenerateEvidenceService.js";
import { createRequest } from "./fixtures.js";

describe("PDF evidence", () => {
  it("generates a non-empty PDF buffer for a completed request", async () => {
    const { request } = await createRequest();
    complete(request);
    const buffer = await new PdfLibEvidencePdfGenerator().generate(request);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBe(1);
    expect(document.getTitle()).toContain(request.id);
    expect(document.getAuthor()).toBe("PurchaseFlow");
    expect(document.getCreator()).toBe("PurchaseFlow Professional Evidence Generator");
    expect(document.getKeywords()).toContain("Approval Summary");
    const rawPdf = buffer.toString("latin1");
    expect(rawPdf).not.toContain("approverToken");
    expect(rawPdf).not.toContain("accessToken");
    expect(rawPdf).not.toContain("otpExpiresAt");
    for (const approver of request.approvers) {
      expect(rawPdf).not.toContain(approver.otp);
      expect(rawPdf).not.toContain(approver.accessToken);
      expect(rawPdf).not.toContain(approver.otpExpiresAt.toISOString());
    }
  });

  it("handles long content without producing an invalid PDF", async () => {
    const { request } = await createRequest();
    complete(request);
    request.title = "Long enterprise purchase evidence ".repeat(12);
    request.description = "Detailed procurement justification and audit context. ".repeat(120);
    const buffer = await new PdfLibEvidencePdfGenerator().generate(request);
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThan(1);
  });

  it("generates a valid and credential-safe PDF for a rejected request with real approver states", async () => {
    const { request } = await createRequest();
    request.approvers[0].status = ApproverStatus.SIGNED;
    request.approvers[0].signedAt = new Date();
    request.approvers[1].status = ApproverStatus.REJECTED;
    request.approvers[1].signedAt = new Date();
    request.status = PurchaseRequestStatus.REJECTED;
    const buffer = await new PdfLibEvidencePdfGenerator().generate(request);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect((await PDFDocument.load(buffer)).getPageCount()).toBeGreaterThanOrEqual(1);
    const rawPdf = buffer.toString("latin1");
    expect(rawPdf).not.toContain("approverToken");
    expect(rawPdf).not.toContain("accessToken");
    expect(rawPdf).not.toContain("otpExpiresAt");
    for (const approver of request.approvers) {
      expect(rawPdf).not.toContain(approver.otp);
      expect(rawPdf).not.toContain(approver.accessToken);
      expect(rawPdf).not.toContain(approver.otpExpiresAt.toISOString());
    }
  });

  it("rejects a pending request", async () => {
    const { request } = await createRequest();
    request.status = PurchaseRequestStatus.PENDING;
    await expect(new PdfLibEvidencePdfGenerator().generate(request)).rejects.toBeInstanceOf(ConflictError);
  });

  it("GenerateEvidenceService rejects a request that is not final", async () => {
    const { request } = await createRequest();
    const service = new GenerateEvidenceService(new PdfLibEvidencePdfGenerator(), new InMemoryEvidenceStorage());
    await expect(service.execute(request)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("InMemoryEvidenceStorage", () => {
  it("saves and retrieves PDF content with safe metadata", async () => {
    const storage = new InMemoryEvidenceStorage();
    const original = Buffer.from("%PDF-test");
    const saved = await storage.save("request-1", original);
    original.fill(0);
    const retrieved = await storage.get("request-1");
    expect(saved.contentType).toBe("application/pdf");
    expect(saved.fileName).toMatch(/\.pdf$/);
    expect(saved.storageKey).toBe("evidence/request-1/evidence.pdf");
    expect(retrieved?.content.toString()).toBe("%PDF-test");
    expect(await storage.get("missing")).toBeNull();
  });
});

function complete(request: Awaited<ReturnType<typeof createRequest>>["request"]): void {
  request.status = PurchaseRequestStatus.COMPLETED;
  for (const approver of request.approvers) {
    approver.status = ApproverStatus.SIGNED;
    approver.signedAt = new Date();
  }
}
