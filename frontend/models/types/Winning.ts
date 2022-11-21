export type Winning = {
  claimed: boolean;
  name: string;
  description?: string;
  puzzleId?: number;
  puzzleGroupId?: number;
  prize: string;
  prize_image_url?: string;
  tokenId?: string;
};
