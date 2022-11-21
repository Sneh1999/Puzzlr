import gameConfig from "gameConfig";
import { IGameConfig } from "models/interfaces/IGameConfig";

export function getGameConfigForGroupId(groupId: number): IGameConfig {
  let config: IGameConfig;
  for (const game in gameConfig) {
    if (gameConfig[game].dropConfig.activePuzzleGroup === groupId) {
      config = gameConfig[game];
      break;
    }
  }

  if (!config) {
    throw new Error(
      `Game with active puzzle group ID ${groupId} not found in config`
    );
  }

  return config;
}
