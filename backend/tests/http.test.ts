import { describe, expect, it } from "vitest";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  ConflictError,
  ExpiredOtpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../src/errors/index.js";
import { errorResponse, jsonResponse } from "../src/http/responses.js";
import { parseApproverCredentials, parseApproverToken, parseJsonBody, requirePathId } from "../src/http/request.js";
import { createPurchaseRequestHandler } from "../src/handlers/createPurchaseRequestHandler.js";
import { getPurchaseRequestHandler } from "../src/handlers/getPurchaseRequestHandler.js";

describe("HTTP helpers", () => {
  it.each([
    [new ValidationError("invalid"), 400],
    [new UnauthorizedError("invalid"), 401],
    [new NotFoundError("missing"), 404],
    [new ExpiredOtpError("expired"), 410],
    [new ConflictError("conflict"), 409],
  ])("maps %s to status %i", (error, status) => {
    expect(errorResponse(error).statusCode).toBe(status);
  });

  it("hides unknown error details and adds JSON/CORS headers", () => {
    const response = errorResponse(new Error("internal database detail"));
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("internal database detail");
    expect(response.body).not.toContain("stack");
    expect(response.headers?.["Access-Control-Allow-Origin"]).toBe("*");
    expect(jsonResponse(200, { ok: true }).headers?.["Content-Type"]).toBe("application/json");
  });

  it("parses JSON, credentials, and path IDs", () => {
    expect(parseJsonBody('{"ok":true}')).toEqual({ ok: true });
    expect(parseApproverCredentials('{"approverToken":"token","otp":"123456"}')).toEqual({ approverToken: "token", otp: "123456" });
    expect(parseApproverToken('{"approverToken":"token"}')).toEqual({ approverToken: "token" });
    expect(requirePathId({ pathParameters: { id: "request" } } as unknown as APIGatewayProxyEvent)).toBe("request");
  });

  it("rejects empty, malformed, or incomplete request data", () => {
    expect(() => parseJsonBody(null)).toThrow(ValidationError);
    expect(() => parseJsonBody("not-json")).toThrow(ValidationError);
    expect(() => parseApproverCredentials("[]")).toThrow(ValidationError);
    expect(() => parseApproverCredentials('{"otp":"123456"}')).toThrow(ValidationError);
    expect(() => parseApproverCredentials('{"approverToken":"token"}')).toThrow(ValidationError);
    expect(() => parseApproverToken('{"otp":"123456"}')).toThrow(ValidationError);
    expect(() => requirePathId({ pathParameters: null } as unknown as APIGatewayProxyEvent)).toThrow(ValidationError);
  });
});

describe("high-value handler validation", () => {
  const context = {} as Context;
  const callback = () => undefined;

  it("returns 400 for a missing create body without composing AWS dependencies", async () => {
    const response = await createPurchaseRequestHandler({ body: null } as unknown as APIGatewayProxyEvent, context, callback);
    expect(response).toMatchObject({ statusCode: 400 });
  });

  it("returns 400 for a missing detail ID without composing AWS dependencies", async () => {
    const response = await getPurchaseRequestHandler({ pathParameters: null } as unknown as APIGatewayProxyEvent, context, callback);
    expect(response).toMatchObject({ statusCode: 400 });
  });
});
