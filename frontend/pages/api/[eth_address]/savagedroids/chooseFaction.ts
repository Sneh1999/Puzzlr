import gameConfig from "gameConfig";
import { IChooseFactionRequest } from "models/interfaces/IChooseFactionRequest";
import { SavageSide } from "models/types/SavageSide";
import { NextApiRequest, NextApiResponse } from "next";
import { INSERT_SAVAGE_SIDE } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const { savageSide }: IChooseFactionRequest = req.body;
  const address = req.query.eth_address as string;

  // NOTE: Okay to be hardcoded for now since we only need this for SD
  const config = gameConfig["savagedroids"];

  if (!address) {
    return apiResponse(res, 400, "Missing address", true);
  }

  if (savageSide !== SavageSide.Community && savageSide !== SavageSide.Theos) {
    return apiResponse(res, 400, "Missing savageSide", true);
  }

  try {
    await dbQuery(INSERT_SAVAGE_SIDE, {
      groupId: config.dropConfig.activePuzzleGroup,
      address: address.toLowerCase(),
      side: Number(savageSide),
    });
    return res.json({
      message: `You chose ${savageSide} - Game Time!`,
    });
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error submitting your chosen faction side : ${error.message}`,
      true
    );
  }
}
