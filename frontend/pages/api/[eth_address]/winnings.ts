import { Puzzle } from "models/types/Puzzle";
import { Winning } from "models/types/Winning";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PUZZLES, FETCH_WINNINGS_FOR_ETH_ADDRESS } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { readFileFromIPFS } from "utils/readFileFromIPFS";
import { subgraphQuery } from "utils/subgraphQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const eth_address = req.query.eth_address as string;
  if (!eth_address) {
    return apiResponse(res, 400, "eth_address must be provided", true);
  }

  try {
    const response = await subgraphQuery(
      FETCH_WINNINGS_FOR_ETH_ADDRESS(eth_address)
    );

    const puzzlesResponse = await dbQuery(FETCH_PUZZLES);
    const puzzles = puzzlesResponse.puzzles as Puzzle[];

    const winnings: Winning[] = [];

    for (let prizeEntity of response.prizes) {
      const puzzle = puzzles.find(
        (p) => p.prizes.indexOf(prizeEntity.prize) >= 0
      );
      const prizeImageUrl = (await readFileFromIPFS(prizeEntity.prize)).image;
      winnings.push({
        claimed: prizeEntity.claimed,
        name: puzzle.name,
        description: puzzle.description,
        prize: prizeEntity.prize,
        tokenId: prizeEntity.tokenId,
        prize_image_url: prizeImageUrl,
        puzzleId: puzzle.id,
        puzzleGroupId: puzzle.group_id,
      });
    }

    return res.json(winnings);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching winnings for ${eth_address}: ${error.message}`,
      true
    );
  }
}
