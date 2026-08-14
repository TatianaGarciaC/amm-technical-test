import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  approvePurchaseRequest,
  createPurchaseRequest,
  downloadEvidence,
  getMockMails,
  getPurchaseRequest,
  listPurchaseRequests,
  rejectPurchaseRequest,
  resendApproverOtp,
  userFacingError,
  validateOtp,
} from "./api";
import { approverDetail, mockMail, pendingRequest } from "../test/fixtures";
import type { CreatePurchaseRequestInput } from "../types/api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("API client", () => {
  it("lists and gets purchase requests from their expected endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([pendingRequest]))
      .mockResolvedValueOnce(jsonResponse(pendingRequest));
    await expect(listPurchaseRequests()).resolves.toEqual([pendingRequest]);
    await expect(getPurchaseRequest("request/1")).resolves.toEqual(pendingRequest);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3000/api/solicitudes");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:3000/api/solicitudes/request%2F1");
  });

  it("creates a request using JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(pendingRequest, 201));
    const input: CreatePurchaseRequestInput = {
      title: "Development laptops", description: "Equipment", amount: 10, requestedBy: "Tatiana",
      approvers: [
        { name: "A", email: "a@example.com", role: "A" },
        { name: "B", email: "b@example.com", role: "B" },
        { name: "C", email: "c@example.com", role: "C" },
      ],
    };
    await expect(createPurchaseRequest(input)).resolves.toEqual(pendingRequest);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/solicitudes", expect.objectContaining({ method: "POST" }));
  });

  it("validates OTP, approves, and rejects with the credential body", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(approverDetail))
      .mockResolvedValueOnce(jsonResponse(pendingRequest))
      .mockResolvedValueOnce(jsonResponse({ ...pendingRequest, status: "REJECTED" }));
    const credentials = { approverToken: "internal-token", otp: "123456" };
    await validateOtp("request-1", credentials);
    await approvePurchaseRequest("request-1", credentials);
    await rejectPurchaseRequest("request-1", credentials);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost:3000/api/solicitudes/request-1/validate-otp",
      "http://localhost:3000/api/solicitudes/request-1/approve",
      "http://localhost:3000/api/solicitudes/request-1/reject",
    ]);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(credentials));
  });

  it("resends an OTP using only the approver token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Verification code resent successfully." }));
    await resendApproverOtp("request/1", "token");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/solicitudes/request%2F1/resend-otp", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ approverToken: "token" }),
    }));
  });

  it("loads the demo mailbox with an optional request filter", async () => {
    fetchMock.mockResolvedValue(jsonResponse([mockMail]));
    await expect(getMockMails("request/1")).resolves.toEqual([mockMail]);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/mock-mail?requestId=request%2F1", expect.any(Object));
  });

  it("turns HTTP failures into safe ApiError instances", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Request not found" }, 404));
    await expect(getPurchaseRequest("missing")).rejects.toMatchObject({ status: 404, message: "Request not found" });

    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 500 }));
    await expect(listPurchaseRequests()).rejects.toMatchObject({ status: 500, message: "The request could not be completed." });
    expect(userFacingError(new ApiError(500, "internal"))).toBe("The service is temporarily unavailable. Please try again.");
    expect(userFacingError(new Error("unknown"))).toBe("Something went wrong. Please try again.");
  });

  it("downloads binary PDF evidence through a temporary object URL", async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(["%PDF-test"], { type: "application/pdf" }), { status: 200 }));
    const createObjectURL = vi.fn(() => "blob:evidence");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await downloadEvidence("request-1");
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:evidence");
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
