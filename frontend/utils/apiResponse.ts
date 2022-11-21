import { NextApiResponse } from "next";

export async function apiResponse(
  res: NextApiResponse,
  statusCode: number,
  message: string,
  error: boolean
) {
  return res.status(statusCode).json({
    error: error ? statusCode : undefined,
    message,
  });
}
