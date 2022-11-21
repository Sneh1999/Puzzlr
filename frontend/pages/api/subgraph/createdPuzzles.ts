import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_CREATED_PUZZLES } from "queries/subgraphQueries";
import { apiResponse } from "utils/apiResponse";
import { subgraphQuery } from "utils/subgraphQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const response = await subgraphQuery(FETCH_CREATED_PUZZLES());
  return res.json(response.puzzles);
}
