import { getGameConfigForGroupId } from "./getGameConfigForGroupId";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function replaceOrEndPuzzleInContract(
  puzzleGroupId: number,
  oldPuzzleId: number,
  oldPuzzleWinner: string,
  oldPuzzlePieces: string[],
  newPuzzleId?: number,
  newPuzzlePieces?: string[],
  newPuzzleMaxWinners?: number,
  newPuzzlePrizes?: string[]
): Promise<any> {
  try {
    const config = getGameConfigForGroupId(puzzleGroupId);
    const managerContract = await getManagerContract(config.path);

    const txnResponse = await managerContract.replaceOrEndPuzzle(
      puzzleGroupId,
      oldPuzzleId,
      oldPuzzleWinner,
      oldPuzzlePieces.map((tid) => tid.split("-").pop()),
      newPuzzleId ? newPuzzleId : "0",
      newPuzzlePieces && newPuzzlePieces.length > 0 ? newPuzzlePieces : [],
      newPuzzleMaxWinners ? newPuzzleMaxWinners : "0",
      newPuzzlePrizes && newPuzzlePrizes.length > 0 ? newPuzzlePrizes : [],
      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );

    return txnResponse;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling replaceOrEndPuzzle in contract: ${reason}`);
  }
}
