import { Piece } from "models/types/Piece";
import { Puzzle } from "models/types/Puzzle";
import { Token } from "models/types/Token";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_TOKENS_BY_OWNER, FETCH_LIVE_PUZZLES } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { readFileFromIPFS } from "utils/readFileFromIPFS";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const eth_address = req.query.eth_address as string;

  if (!eth_address) {
    return apiResponse(
      res,
      400,
      "eth_address must be provided for the owner",
      true
    );
  }

  try {
    const owner = eth_address;
    const ownerCIDsResonse = await dbQuery(FETCH_TOKENS_BY_OWNER, {
      owner: owner.toLowerCase(),
    });
    if (!ownerCIDsResonse || ownerCIDsResonse.length === 0) {
      return res.json([]);
    }
    const ownerTokens = ownerCIDsResonse.tokens as Token[];
    const livePuzzlesResponse = await dbQuery(FETCH_LIVE_PUZZLES);
    const livePuzzles = livePuzzlesResponse.puzzles as Puzzle[];
    const liveTokens: Piece[] = [];

    console.log({ ownerTokens });
    console.log({ peices: livePuzzles[0].pieces });

    for (let ownerToken of ownerTokens) {
      for (let livePuzzle of livePuzzles) {
        if (livePuzzle.pieces.indexOf(ownerToken.cid) > -1) {
          const _piece = {
            ...ownerToken,
            puzzle_id: livePuzzle.id,
            puzzle_name: livePuzzle.name,
            puzzle_group_id: livePuzzle.group_id,
          };
          liveTokens.push(_piece);
          break;
        }
      }
    }

    console.log({ liveTokens });
    return res.json(liveTokens);
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error fetching the ongoing pieces for ${eth_address}: ${error.message}`,
      true
    );
  }
}
