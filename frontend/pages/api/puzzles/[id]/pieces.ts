import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PUZZLE_PIECES_BY_PUZZLE_ID } from "queries";
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
    const pieces = await getPiecesForPuzzleId(id);
    return res.json(pieces);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching puzzle ${id} pieces: ${error.message}`,
      true
    );
  }
}

export async function getPiecesForPuzzleId(id: number): Promise<string[]> {
  const response = await dbQuery(FETCH_PUZZLE_PIECES_BY_PUZZLE_ID, {
    id,
  });
  if (!response.puzzles[0]) {
    throw new Error(`puzzle ${id} does not exist`);
  }
  const pieces = response.puzzles[0].pieces as string[];
  return pieces;
}
