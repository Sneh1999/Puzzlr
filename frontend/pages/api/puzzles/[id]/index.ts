import { Puzzle } from "models/types/Puzzle";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PUZZLE_BY_ID } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }
  const id = Number(req.query.id as string);
  if (!id) {
    return apiResponse(res, 400, "id must be a number", true);
  }

  try {
    const response = await dbQuery(FETCH_PUZZLE_BY_ID, {
      id,
    });
    const puzzle = response.puzzles[0] as Puzzle;
    if (!puzzle) {
      return apiResponse(res, 400, `puzzle ${id} does not exist`, true);
    }
    return res.json(puzzle);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching puzzle ${id}: ${error.message}`,
      true
    );
  }
}
