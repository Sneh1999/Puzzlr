import { MIN_PUZZLES_TO_START_BATCH } from "constants/constants";
import { withAuthMiddleware } from "middlewares/authMiddleware";
import { Puzzle } from "models/types/Puzzle";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PUZZLE_BY_GROUP_ID, UPDATE_STARTED_IN_PUZZLES } from "queries";
import { apiResponse } from "utils/apiResponse";
import { batchStartNewPuzzlesInContract } from "utils/batchStartNewPuzzlesInContract";
import { dbQuery } from "utils/dbQuery";

export default withAuthMiddleware(handler);

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const id = Number(req.query.id as string);
  const limit = Number(req.body.limit as string);

  if (!id) {
    return apiResponse(res, 400, "id must be number", true);
  }

  try {
    let response = await dbQuery(FETCH_PUZZLE_BY_GROUP_ID, {
      id,
      limit,
    });

    const puzzles: Puzzle[] = response.puzzles as Puzzle[];
    // Limit the number of initial puzzles to MIN_PUZZLES_TO_START_BATCH
    if (!puzzles || puzzles.length < MIN_PUZZLES_TO_START_BATCH) {
      return apiResponse(
        res,
        400,
        `puzzles for the given group ${id} does not exist or are not >= ${MIN_PUZZLES_TO_START_BATCH}`,
        true
      );
    }

    const puzzleIds: number[] = [];
    const puzzlePieces: string[][] = [];
    const maxWinners: number[] = [];
    const prizes: string[][] = [];

    for (let p of puzzles) {
      puzzleIds.push(p.id);
      puzzlePieces.push(p.pieces);
      maxWinners.push(p.max_winners);
      prizes.push(p.prizes);
    }
    // Start the puzzles in the contract
    const hash = await batchStartNewPuzzlesInContract(
      id,
      puzzleIds,
      puzzlePieces,
      maxWinners,
      prizes
    );
    console.log(
      `Started puzzles for group id : ${id} with transaction hash: ${hash}`
    );

    // Mark the puzzles as started in the db
    response = await dbQuery(UPDATE_STARTED_IN_PUZZLES, {
      idArray: puzzleIds,
    });

    return res.json(hash);
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error starting puzzles for the given group id :  ${id} : ${error.message}`,
      true
    );
  }
}
