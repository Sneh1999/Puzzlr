import { getGameConfigForGroupId } from "./getGameConfigForGroupId";
import { getManagerContract } from "./getManagerContract";
import { getProvider } from "./getProvider";
import { METATRANSACTION_TIMEOUT } from "../constants/constants";

export async function buyPackForGroupInContract(
  puzzleGroupId: number,
  recipient: string,
  packTier: number
): Promise<string> {
  try {
    console.log("I came here");
    const config = getGameConfigForGroupId(puzzleGroupId);
    const managerContract = await getManagerContract(config.path);

    let txnResponse = null;
    console.log("I was here too");
    txnResponse = await managerContract.buyPackForTier(
      puzzleGroupId,
      recipient,
      packTier
    );
    console.log(txnResponse);
    // let count = 1;
    // let timeout = setInterval(async () => {
    //   const txReceipt = await getProvider().getTransactionReceipt(
    //     txnResponse.hash
    //   );
    //   if (!(txReceipt && txReceipt.blockNumber) && count <= 5) {
    //     count++;
    //     txnResponse = await managerContract.buyPackForTier(
    //       puzzleGroupId,
    //       recipient,
    //       packTier,
    //       {
    //         gasPrice: (await getProvider().getGasPrice()).mul(2),
    //         nonce: txnResponse.nonce,
    //       }
    //     );
    //   } else {
    //     clearInterval(timeout);
    //   }
    // }, METATRANSACTION_TIMEOUT);
    console.log(` Transaction response hash is ${txnResponse.hash}`);
    return txnResponse.hash;
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    const reason = JSON.parse(error.error.error.body).error.message;
    throw new Error(`Error calling buyPackForGroup in contract: ${reason}`);
  }
}
