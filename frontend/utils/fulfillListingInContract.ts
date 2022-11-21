import { METATRANSACTION_TIMEOUT } from "constants/constants";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function fulfillListingInContract(
  game: string,
  sellerTokenId: string,
  buyerTokenId: string,
  seller: string,
  buyer: string
): Promise<string> {
  try {
    const managerContract = await getManagerContract(game);

    let txnResponse = null;
    txnResponse = await managerContract.fulfillListing(
      sellerTokenId,
      buyerTokenId,
      seller,
      buyer,
      {
        gasPrice: (await getProvider().getGasPrice()).mul(2),
      }
    );
    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling fulfillListing in contract: ${reason}`);
  }
}
