import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import {
  errorResponse,
  jsonResponse,
  parseApproverCredentials,
  requirePathId,
} from "../http/index.js";

export const approvePurchaseRequestHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const purchaseRequestId = requirePathId(event);
    const credentials = parseApproverCredentials(event.body);
    const result = await getContainer().approvePurchaseRequest.execute({
      purchaseRequestId,
      ...credentials,
    });
    return jsonResponse(200, result);
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
