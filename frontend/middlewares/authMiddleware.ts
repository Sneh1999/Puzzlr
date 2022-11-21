import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from "utils/apiResponse";

export function withAuthMiddleware(handler: NextApiHandler): NextApiHandler {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return apiResponse(res, 403, "Missing x-api-key header", true);
    }

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return apiResponse(res, 403, "Invalid x-api-key header", true);
    }

    return await handler(req, res);
  };
}
