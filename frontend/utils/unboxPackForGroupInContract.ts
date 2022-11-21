import { METATRANSACTION_TIMEOUT } from "constants/constants";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";

export async function unboxPackForGroupInContract(
  game: string,
  requestId: string
): Promise<string> {
  try {
    const managerContract = await getManagerContract(game);

    let txnResponse = null;
    txnResponse = await managerContract.unboxPack(requestId);

    return txnResponse.hash;
  } catch (error) {
    console.error(error);
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling unboxPackForGroup in contract: ${reason}`);
  }
}
