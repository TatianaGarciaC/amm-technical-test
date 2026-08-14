import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { purchaseRequestToResponseDTO } from "../repositories/index.js";
import { errorResponse, jsonResponse, parseJsonBody } from "../http/index.js";

export const createPurchaseRequestHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = parseJsonBody(event.body);
    const request = await getContainer().createPurchaseRequest.execute(body);
    return jsonResponse(201, purchaseRequestToResponseDTO(request));
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
