import { EPackEventType } from "models/enums/EPackEventType";
import { EPackTiers } from "models/enums/EPackTiers";

export type PackEntity = {
  id: string;
  puzzleGroupId: string;
  requestId: string;
  owner: string;
  tokenIds?: string[];
  type: EPackEventType;
  tier: EPackTiers;
};
