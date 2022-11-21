import { Token } from "./Token";

export type Piece = Token & {
  puzzle_id: number;
  puzzle_group_id: number;
  puzzle_name: string;
};
