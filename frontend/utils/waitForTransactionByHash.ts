import { TransactionReceipt, Web3Provider } from "@ethersproject/providers";
import { sleep } from "./sleep";

export async function waitForTransactionByHash(
  provider: Web3Provider,
  hash: string
): Promise<TransactionReceipt> {
  let txnReceipt: TransactionReceipt;
  while (!(txnReceipt && txnReceipt.blockNumber)) {
    txnReceipt = await provider.getTransactionReceipt(hash);
    await sleep(100);
  }
  return txnReceipt;
}
