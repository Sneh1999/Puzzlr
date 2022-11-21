export type Puzzle = {
  id: number;
  group_id: number;
  name: string;
  description?: string;
  grid_size: number;
  pieces: string[];
  prize: string;
  started: boolean;
  artwork: string;
  completed: boolean;
  remaining_winners?: number;
  created_at: string;
  updated_at: string;
};

export type UserEvent = {
  uuid: string;
  type: string;
  body: Record<string, any>;
  inserted_at: string;
  address: string;
};
