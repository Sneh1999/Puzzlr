import { Wallet } from "@ethersproject/wallet";
import { createCipheriv } from "crypto";
import gameConfig from "gameConfig";
import { withAuthMiddleware } from "middlewares/authMiddleware";
import { NextApiRequest, NextApiResponse } from "next";
import { INSERT_BOUNCER } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { getManagerContract } from "utils/getManagerContract";
import { getProvider } from "utils/getProvider";
export default withAuthMiddleware(handler);

function encrypt(plainText: string, key: string) {
  const cipher = createCipheriv("aes-128-ecb", key, null);
  return Buffer.concat([cipher.update(plainText), cipher.final()]).toString(
    "base64"
  );
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const id = req.body.id as number;
  if (!id) {
    return apiResponse(res, 400, "Missing id", true);
  }
  try {
    const wallet = Wallet.createRandom();
    const encrypted = encrypt(wallet.privateKey, process.env.ENCRYPTION_KEY);

    await dbQuery(INSERT_BOUNCER, {
      id,
      address: wallet.address.toLowerCase(),
      privateKey: encrypted,
      active: false,
    });

    const networkName = "aurora";

    for (const game in gameConfig) {
      if (gameConfig[game].networkConfig[networkName].managerAddress) {
        const managerContract = await getManagerContract(game);
        await managerContract.whitelistAddress(wallet.address.toLowerCase(), {
          gasPrice: (await getProvider().getGasPrice()).mul(2),
        });
      }
    }

    return apiResponse(res, 200, "Created a bouncer", false);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error creating new bouncer: ${error.message}`,
      true
    );
  }
}
