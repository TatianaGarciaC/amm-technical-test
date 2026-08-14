import type { APIGatewayProxyResult } from "aws-lambda";
import {
  ConflictError,
  ExpiredOtpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/index.js";

/** Development CORS policy. Restrict the origin to the frontend domain in production. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function errorResponse(error: unknown): APIGatewayProxyResult {
  if (error instanceof ValidationError) return knownError(400, error);
  if (error instanceof UnauthorizedError) return knownError(401, error);
  if (error instanceof NotFoundError) return knownError(404, error);
  if (error instanceof ExpiredOtpError) return knownError(410, error);
  if (error instanceof ConflictError) return knownError(409, error);

  // Never expose internal errors, stack traces, AWS details, or secrets.
  return jsonResponse(500, { error: "InternalServerError", message: "Internal server error" });
}

function knownError(statusCode: number, error: Error): APIGatewayProxyResult {
  return jsonResponse(statusCode, { error: error.name, message: error.message });
}
