import { NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { FETCH_LIVE_PUZZLES, FETCH_METADATAS_BY_CIDS } from "queries";
import { Puzzle } from "models/types/Puzzle";
import { Metadata } from "models/types/Metadata";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  try {
    let livePuzzles = await getLivePuzzles();
    return res.json(livePuzzles);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching ongoing puzzles: ${error.message}`,
      true
    );
  }
}

export async function getLivePuzzles(): Promise<Puzzle[]> {
  const response = await dbQuery(FETCH_LIVE_PUZZLES);
  const livePuzzles = response.puzzles as Puzzle[];
  if (livePuzzles.length === 0) {
    return [];
  }
  const cids = livePuzzles.flatMap((p) => [...p.pieces, ...p.prizes]);
  const imagesResponse = await dbQuery(FETCH_METADATAS_BY_CIDS, { cids });
  const metadata = imagesResponse.metadata as Metadata[];

  const metadataByCid = Object.fromEntries(metadata.map((m) => [m.cid, m]));

  for (let puzzle of livePuzzles) {
    puzzle.pieces_image_urls = puzzle.pieces.map(
      (piece) => metadataByCid[piece].image_url
    );
    puzzle.prizes_image_urls = puzzle.prizes.map(
      (prize) => metadataByCid[prize].image_url
    );
  }
  return livePuzzles;
}
