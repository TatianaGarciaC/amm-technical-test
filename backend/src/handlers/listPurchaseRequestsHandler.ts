import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { errorResponse, jsonResponse } from "../http/index.js";

export const listPurchaseRequestsHandler: APIGatewayProxyHandler = async () => {
  try {
    return jsonResponse(200, await getContainer().listPurchaseRequests.execute());
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
