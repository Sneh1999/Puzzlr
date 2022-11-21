import { NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from "utils/apiResponse";
import { verifyGoogleCaptcha } from "utils/verifyGoogleCaptcha";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }
  const token = req.body.token as string;
  if (!token) {
    return apiResponse(res, 400, "token must be provided", true);
  }

  try {
    const result = await verifyGoogleCaptcha(token);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error verifying ReCAPTCHA: ${error.message}`,
      true
    );
  }
}
