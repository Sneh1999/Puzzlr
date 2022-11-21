import { NextApiRequest, NextApiResponse } from "next";
import { withAuthMiddleware } from "middlewares/authMiddleware";
import { ICreatePuzzleGroupRequest } from "models/interfaces/ICreatePuzzleGroupRequest";
import { apiResponse } from "utils/apiResponse";
import { createPuzzleGroupInDatabase } from "utils/createPuzzleGroupInDatabase";

export default withAuthMiddleware(handler);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const createPuzzleGroupRequest: ICreatePuzzleGroupRequest = req.body;

  if (!createPuzzleGroupRequest.name) {
    return apiResponse(res, 400, "Missing name for puzzle group", true);
  }

  if (!createPuzzleGroupRequest.description) {
    return apiResponse(res, 400, "Missing description for puzzle group", true);
  }

  try {
    const puzzleGroup = await createPuzzleGroupInDatabase(
      createPuzzleGroupRequest
    );

    return res.json(puzzleGroup);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error creating a new puzzle group: ${error.message}`,
      true
    );
  }
}
