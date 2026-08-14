import type { APIGatewayProxyHandler } from "aws-lambda";
import { getContainer } from "../app/container.js";
import { NotFoundError } from "../errors/index.js";
import { corsHeaders, errorResponse, requirePathId } from "../http/index.js";

export const getEvidenceHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = requirePathId(event);
    const evidence = await getContainer().evidenceStorage.get(id);
    if (!evidence) throw new NotFoundError("Evidence PDF not found");
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": evidence.contentType,
        "Content-Disposition": `attachment; filename="${evidence.fileName}"`,
      },
      body: evidence.content.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error: unknown) {
    return errorResponse(error);
  }
};
