import type { APIGatewayProxyEvent } from "aws-lambda";
import { ValidationError } from "../errors/index.js";

export function parseJsonBody(body: string | null): unknown {
  if (!body?.trim()) throw new ValidationError("Request body is required");
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ValidationError("Request body must contain valid JSON");
  }
}

export function requirePathId(event: APIGatewayProxyEvent): string {
  const id = event.pathParameters?.id?.trim();
  if (!id) throw new ValidationError("Path parameter id is required");
  return id;
}

export interface ApproverCredentials {
  approverToken: string;
  otp: string;
}

export function parseApproverToken(body: string | null): { approverToken: string } {
  const parsed = parseJsonBody(body);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  const approverToken = (parsed as Record<string, unknown>).approverToken;
  if (typeof approverToken !== "string" || !approverToken.trim()) {
    throw new ValidationError("approverToken is required");
  }
  return { approverToken: approverToken.trim() };
}

export function parseApproverCredentials(body: string | null): ApproverCredentials {
  const parsed = parseJsonBody(body);
  if (typeof parsed !== "object" || parsed === null) {
    throw new ValidationError("Request body must be a JSON object");
  }
  const values = parsed as Record<string, unknown>;
  if (typeof values.approverToken !== "string" || !values.approverToken.trim()) {
    throw new ValidationError("approverToken is required");
  }
  if (typeof values.otp !== "string" || !values.otp.trim()) {
    throw new ValidationError("otp is required");
  }
  return { approverToken: values.approverToken, otp: values.otp };
}
