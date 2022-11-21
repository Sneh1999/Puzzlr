import { METATRANSACTION_TIMEOUT } from "constants/constants";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function createNewListingInContract(
  game: string,
  sellerTokenIds: string[],
  wants: string,
  seller: string
): Promise<string> {
  try {
    const managerContract = await getManagerContract(game);

    let txnResponse = null;
    txnResponse = await managerContract.createListing(
      sellerTokenIds,
      wants,
      seller,

      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );
    let count = 1;
    let timeout = setInterval(async () => {
      const txReceipt = await getProvider().getTransactionReceipt(
        txnResponse.hash
      );
      if (!(txReceipt && txReceipt.blockNumber) && count <= 5) {
        count++;
        txnResponse = await managerContract.createListing(
          sellerTokenIds,
          wants,
          seller,
          {
            gasPrice: (await getProvider().getGasPrice()).mul(2),
            nonce: txnResponse.nonce,
          }
        );
      } else {
        clearInterval(timeout);
      }
    }, METATRANSACTION_TIMEOUT);
    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling  createListing in contract: ${reason}`);
  }
}
