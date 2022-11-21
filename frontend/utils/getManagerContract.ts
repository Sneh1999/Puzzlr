import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { createDecipheriv } from "crypto";
import gameConfig from "gameConfig";
import { Bouncer } from "models/types/Bouncer";
import { FETCH_ACTIVE_BOUNCER, UPDATE_ACTIVE_BOUNCER } from "queries";
import { dbQuery } from "./dbQuery";

function decrypt(cipherText: Buffer, key: string) {
  const cipher = createDecipheriv("aes-128-ecb", key, null);
  return Buffer.concat([cipher.update(cipherText), cipher.final()]).toString();
}

export async function getManagerContract(game: string): Promise<Contract> {
  try {
    let privateKey = null;
    const bouncerResponse = await dbQuery(FETCH_ACTIVE_BOUNCER);
    const activeBouncer = bouncerResponse.bouncers[0] as Bouncer;
    if (bouncerResponse.bouncers.length > 0) {
      const bouncerCount = bouncerResponse.bouncers_aggregate.aggregate
        .count as number;

      await dbQuery(UPDATE_ACTIVE_BOUNCER, {
        nextId: (activeBouncer.id % bouncerCount) + 1,
        activeId: activeBouncer.id,
      });

      const decryptedPvtKey = decrypt(
        Buffer.from(activeBouncer.privateKey, "base64"),
        process.env.ENCRYPTION_KEY
      );
      privateKey = decryptedPvtKey;
      console.log("Currently choose address: " + activeBouncer.address);
    } else {
      privateKey = process.env.PRIVATE_KEY;
    }

    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(new JsonRpcProvider(process.env.RPC_URL));
    const networkName = "aurora"
    const managerContract = new Contract(
      gameConfig[game].networkConfig[networkName].managerAddress,
      gameConfig[game].networkConfig[networkName].managerAbi,
      signer
    );

    return managerContract;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Could not get manager contract instance: ${error.message}`
    );
  }
}
