import gameConfig from "gameConfig";
import { NextApiRequest, NextApiResponse } from "next";
import { QUERY_SAVAGE_SIDE_FOR_ACCOUNT } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const address = req.query.eth_address as string;
  // NOTE: Okay to be hardcoded for now since we only need this for SD
  const config = gameConfig["savagedroids"];

  if (!address) {
    return apiResponse(res, 400, "Missing address", true);
  }

  try {
    const { savage_side: sideData } = await dbQuery(
      QUERY_SAVAGE_SIDE_FOR_ACCOUNT,
      {
        groupId: config.dropConfig.activePuzzleGroup,
        address: address.toLowerCase(),
      }
    );

    if (sideData.length > 0) {
      return res.send(true);
    } else {
      return res.send(false);
    }
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error submitting your chosen faction side: ${error.message}`,
      true
    );
  }
}
