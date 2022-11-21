import { ICreatePuzzleGroupRequest } from "models/interfaces/ICreatePuzzleGroupRequest";
import { PuzzleGroup } from "models/types/PuzzleGroup";
import { CREATE_PUZZLE_GROUP } from "queries";
import { dbQuery } from "./dbQuery";

export async function createPuzzleGroupInDatabase(
  cpr: ICreatePuzzleGroupRequest
): Promise<PuzzleGroup> {
  console.log(`Creating puzzle group ${cpr.name}`);

  try {
    const dbResponse = await dbQuery(CREATE_PUZZLE_GROUP, {
      name: cpr.name,
      description: cpr.description,
    });
    const puzzleGroup = dbResponse.insert_puzzle_groups
      .returning[0] as PuzzleGroup;
    return puzzleGroup;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Error creating a puzzle group in the database: ${error.message}`
    );
  }
}
