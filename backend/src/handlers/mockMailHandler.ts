import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { errorResponse, jsonResponse } from "../http/index.js";

/** Demonstration-only mailbox. A real production system must protect or remove this endpoint. */
export const mockMailHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const requestId = event.queryStringParameters?.requestId?.trim();
    const mails = requestId
      ? await getContainer().mailService.findByPurchaseRequestId(requestId)
      : await getContainer().mailService.findAll();
    return jsonResponse(200, mails);
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
