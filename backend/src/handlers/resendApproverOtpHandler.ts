import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { errorResponse, jsonResponse, parseApproverToken, requirePathId } from "../http/index.js";

export const resendApproverOtpHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const purchaseRequestId = requirePathId(event);
    const result = await getContainer().resendApproverOtp.execute({
      purchaseRequestId,
      ...parseApproverToken(event.body),
    });
    return jsonResponse(200, result);
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
