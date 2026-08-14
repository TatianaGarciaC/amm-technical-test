import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { errorResponse, jsonResponse, requirePathId } from "../http/index.js";

export const getPurchaseRequestHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = requirePathId(event);
    const result = await getContainer().getPurchaseRequest.execute(id);
    return jsonResponse(200, result);
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
