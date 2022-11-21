import { NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from "utils/apiResponse";
import { createPuzzleInDatabase } from "utils/createPuzzleInDatabase";
import { withAuthMiddleware } from "middlewares/authMiddleware";
import { ICreatePuzzleRequest } from "models/interfaces/ICreatePuzzleRequest";

export default withAuthMiddleware(handler);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  let createPuzzleRequest: ICreatePuzzleRequest = req.body;

  if (!createPuzzleRequest.imageUrl) {
    return apiResponse(res, 400, "Missing imageUrl", true);
  }

  if (!createPuzzleRequest.groupId) {
    return apiResponse(res, 400, "Missing groupId", true);
  }

  if (
    typeof createPuzzleRequest.gridSize !== "number" ||
    createPuzzleRequest.gridSize <= 0
  ) {
    return apiResponse(
      res,
      400,
      "Missing gridSize or invalid format - must be a number",
      true
    );
  }

  if (!createPuzzleRequest.name) {
    return apiResponse(res, 400, "Missing name", true);
  }

  if (!createPuzzleRequest.maxWinners) {
    createPuzzleRequest.maxWinners = 1;
  }

  try {
    const puzzle = await createPuzzleInDatabase(createPuzzleRequest);
    return res.json(puzzle);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error creating new puzzle: ${error.message}`,
      true
    );
  }
}
