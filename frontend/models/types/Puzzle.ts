export type Puzzle = {
  id: number;
  group_id: number;
  name: string;
  artwork: string;
  description?: string;
  grid_size: number;
  pieces: string[];
  pieces_image_urls?: string[];
  prize: string; // deprecated
  prize_image_url?: string; // deprecated
  prizes: string[];
  prizes_image_urls?: string[];
  max_winners: number;
  remaining_winners?: number;
  started: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
};
