import { Contract } from "@ethersproject/contracts";
import gameConfig from "gameConfig";
import { getProvider } from "./getProvider";

export function getPieceFactoryContract(game: string): Contract {
  try {
    const provider = getProvider();
    const networkName = "aurora";
    const config = gameConfig[game];

    const pieceFactoryContract = new Contract(
      config.networkConfig[networkName].pieceFactoryAddress,
      config.networkConfig[networkName].pieceFactoryAbi,
      provider
    );
    return pieceFactoryContract;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Could not get piece factory contract instance: ${error.message}`
    );
  }
}
