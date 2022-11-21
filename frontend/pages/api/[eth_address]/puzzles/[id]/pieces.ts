import { Piece } from "models/types/Piece";
import { Puzzle } from "models/types/Puzzle";
import { Token } from "models/types/Token";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PUZZLE_BY_ID, FETCH_TOKENS_BY_OWNER } from "queries";
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
  const id = Number(req.query.id as string);

  if (!eth_address) {
    return apiResponse(
      res,
      400,
      "eth_address must be provided for the owner",
      true
    );
  }

  if (!id) {
    return apiResponse(res, 400, "id must be a number", true);
  }

  try {
    const puzzleResponse = await dbQuery(FETCH_PUZZLE_BY_ID, {
      id,
    });
    const puzzle = puzzleResponse.puzzles[0] as Puzzle;
    if (!puzzle) {
      return apiResponse(res, 400, `puzzle ${id} does not exist`, true);
    }

    const ownerCIDsResponse = await dbQuery(FETCH_TOKENS_BY_OWNER, {
      owner: eth_address.toLowerCase(),
    });
    if (!ownerCIDsResponse || ownerCIDsResponse.length === 0) {
      return res.json([]);
    }

    const ownerTokens = ownerCIDsResponse.tokens as Token[];
    const ownerTokensForPuzzle: Piece[] = [];

    for (let ownerToken of ownerTokens) {
      if (puzzle.pieces.indexOf(ownerToken.cid) > -1) {
        //fetches the image gateway url from the cid
        ownerTokensForPuzzle.push({
          ...ownerToken,
          puzzle_name: puzzle.name,
          puzzle_id: puzzle.id,
          puzzle_group_id: puzzle.group_id,
        });
      }
    }

    return res.json(ownerTokensForPuzzle);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching puzzle ${id} pieces for ${eth_address}: ${error.message}`,
      true
    );
  }
}
