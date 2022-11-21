import { getGameConfigForGroupId } from "./getGameConfigForGroupId";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function startNewPuzzleInContract(
  puzzleGroupId: number,
  puzzleId: number,
  pieces: string[]
): Promise<string> {
  try {
    const config = getGameConfigForGroupId(puzzleGroupId);
    const managerContract = await getManagerContract(config.path);
    const txnResponse = await managerContract.startNewPuzzle(
      puzzleGroupId,
      puzzleId,
      pieces,
      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );
    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling startNewPuzzle in contract: ${reason}`);
  }
}
