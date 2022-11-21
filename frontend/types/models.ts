import { HasuraNS } from "types";

export type CompletedPuzzle = Pick<HasuraNS.Puzzle, "id" | "name" | "artwork">;
export type RemainingWinnersPuzzle = Pick<
  HasuraNS.Puzzle,
  "id" | "remaining_winners"
>;
