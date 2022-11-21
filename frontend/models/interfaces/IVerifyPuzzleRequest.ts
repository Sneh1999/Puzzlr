export interface IVerifyPuzzleRequest {
  puzzleId: string;
  puzzleCIDs: string[];
  winner: string;
  winnerHash: string;
}
