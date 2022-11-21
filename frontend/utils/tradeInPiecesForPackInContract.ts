import { METATRANSACTION_TIMEOUT } from "constants/constants";
import { EPackTiers } from "models/enums/EPackTiers";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function tradeInPiecesForPackInContract(
  game: string,
  pieceIds: string[],
  packTier: EPackTiers,
  puzzleGroupId: string,
  recipient: string
): Promise<string> {
  try {
    const managerContract = await getManagerContract(game);

    let txnResponse = null;
    txnResponse = await managerContract.tradeInPiecesForPack(
      pieceIds,
      packTier,
      puzzleGroupId,
      recipient,
      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );
    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(
      `Error calling  tradeInPiecesForPack in contract: ${reason}`
    );
  }
}
