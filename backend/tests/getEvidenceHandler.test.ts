import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { describe, expect, it, vi } from "vitest";

const getEvidence = vi.fn(async () => ({
  content: Buffer.from("%PDF-rejected-evidence"),
  contentType: "application/pdf",
  fileName: "purchase-request-rejected-evidence.pdf",
  storageKey: "evidence/rejected-request/evidence.pdf",
}));

vi.mock("../src/app/container.js", () => ({
  getContainer: () => ({ evidenceStorage: { get: getEvidence } }),
}));

import { getEvidenceHandler } from "../src/handlers/getEvidenceHandler.js";

describe("getEvidenceHandler", () => {
  it("downloads an existing rejected-request evidence without a COMPLETED-only guard", async () => {
    const response = await getEvidenceHandler(
      { pathParameters: { id: "rejected-request" } } as unknown as APIGatewayProxyEvent,
      {} as Context,
      () => undefined
    );

    expect(getEvidence).toHaveBeenCalledWith("rejected-request");
    expect(response).toMatchObject({
      statusCode: 200,
      isBase64Encoded: true,
      headers: { "Content-Type": "application/pdf" },
    });
  });
});
