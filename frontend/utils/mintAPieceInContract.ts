import { getGameConfigForGroupId } from "./getGameConfigForGroupId";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";
import { METATRANSACTION_TIMEOUT } from "../constants/constants";

export async function mintAPieceInContract(
  puzzleGroupId: number,
  recipient: string,
  pieces: string[]
): Promise<string> {
  try {
    const config = getGameConfigForGroupId(puzzleGroupId);
    const managerContract = await getManagerContract(config.path);

    let txnResponse = null;
    txnResponse = await managerContract.airdropPieces(recipient, pieces, {
      gasPrice: (await getProvider().getGasPrice()).mul(2),
    });
    let count = 1;
    let timeout = setInterval(async () => {
      const txReceipt = await getProvider().getTransactionReceipt(
        txnResponse.hash
      );
      if (!(txReceipt && txReceipt.blockNumber) && count <= 5) {
        count++;
        txnResponse = await managerContract.airdropPieces(recipient, pieces, {
          gasPrice: (await getProvider().getGasPrice()).mul(2),
          nonce: txnResponse.nonce,
        });
      } else {
        clearInterval(timeout);
      }
    }, METATRANSACTION_TIMEOUT);

    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error?.error?.error?.body)?.error?.message;
    throw new Error(`Error calling airdropPieces in contract: ${reason}`);
  }
}
