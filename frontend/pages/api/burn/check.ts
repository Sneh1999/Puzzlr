import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_BURN_REQUEST_FOR_ADDRESS } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const { ethAddress } = req.query;
  if (!ethAddress) {
    return apiResponse(res, 400, "ETH address not provided", true);
  }

  try {
    const response = await dbQuery(FETCH_BURN_REQUEST_FOR_ADDRESS, {
      address: (ethAddress as string).toLowerCase(),
    });

    if (response.requested_burns.length > 0) {
      return res.json({ requestedBurn: true });
    } else {
      return res.json({ requestedBurn: false });
    }
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error checking for burn request: ${error.message}`,
      true
    );
  }
}
