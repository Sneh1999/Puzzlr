import { Piece } from "models/types/Piece";
import { Puzzle } from "models/types/Puzzle";
import { Token } from "models/types/Token";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_EXPIRED_PUZZLES, FETCH_TOKENS_BY_OWNER } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";

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

    const expiredPuzzlesResponse = await dbQuery(FETCH_EXPIRED_PUZZLES);
    const expiredPuzzles = expiredPuzzlesResponse.puzzles as Puzzle[];

    if (!ownerCIDsResonse || ownerCIDsResonse.length === 0) {
      return res.json([]);
    }
    const ownerTokens = ownerCIDsResonse.tokens as Token[];

    const expiredTokens: Piece[] = [];

    for (let ownerToken of ownerTokens) {
      for (let expiredPuzzle of expiredPuzzles) {
        if (expiredPuzzle.pieces.indexOf(ownerToken.cid) > -1) {
          const _piece = {
            ...ownerToken,
            puzzle_id: expiredPuzzle.id,
            puzzle_name: expiredPuzzle.name,
            puzzle_group_id: expiredPuzzle.group_id,
          };
          expiredTokens.push(_piece);
          break;
        }
      }
    }
    return res.json(expiredTokens);
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error fetching the expired pieces for ${eth_address}: ${error.message}`,
      true
    );
  }
}
