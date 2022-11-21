import { getGameConfigForGroupId } from "./getGameConfigForGroupId";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function batchStartNewPuzzlesInContract(
  puzzleGroupId: number,
  puzzleIds: number[],
  pieces: string[][],
  maxWinners: number[],
  prizes: string[][]
): Promise<string> {
  try {
    const config = getGameConfigForGroupId(puzzleGroupId);
    const managerContract = await getManagerContract(config.path);
    const txnResponse = await managerContract.batchStartNewPuzzles(
      puzzleGroupId,
      puzzleIds,
      pieces,
      maxWinners,
      prizes,
      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );
    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(
      `Error calling batchStartNewPuzzles in contract: ${reason}`
    );
  }
}
