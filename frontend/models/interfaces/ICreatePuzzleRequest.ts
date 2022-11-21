export interface ICreatePuzzleRequest {
  imageUrl: string;
  gridSize: number;
  groupId: number;
  name: string;
  description?: string;
  maxWinners?: number;
  prizes?: string[] | string;
}
