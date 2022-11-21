import { NextApiRequest, NextApiResponse } from "next";
import { INSERT_BURN_REQUEST } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { verifySignature } from "../metatxns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const { ethAddress, signature } = req.body;
  if (!ethAddress) {
    return apiResponse(res, 400, "ETH address not provided", true);
  }

  if (!signature) {
    return apiResponse(res, 400, "Signature not provided", true);
  }
  try {
    const verifiedSignature = verifySignature(ethAddress, signature);

    if (verifiedSignature) {
      await dbQuery(INSERT_BURN_REQUEST, {
        address: (ethAddress as string).toLowerCase(),
      });

      return apiResponse(res, 200, "", false);
    } else {
      return apiResponse(res, 400, "Invalid signature", true);
    }
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error making burn request: ${(error.message as string).substring(
        0,
        200
      )}`,
      true
    );
  }
}
