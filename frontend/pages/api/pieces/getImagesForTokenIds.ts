import gameConfig from "gameConfig";
import { Token } from "models/types/Token";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_TOKENS_BY_TOKEN_IDS } from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { getPieceFactoryContract } from "utils/getPieceFactoryContract";
import { readFileFromIPFS } from "utils/readFileFromIPFS";
import { sleep } from "utils/sleep";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  try {
    const tokenIds = req.body.tokenIds as string[];
    if (!tokenIds) {
      return apiResponse(res, 400, "Empty tokenIds passed", true);
    }

    const game = req.body.game as string;
    const config = gameConfig[game];

    if (!config) {
      return apiResponse(res, 400, "Invalid game passed", true);
    }

    const pieceFactoryContract = getPieceFactoryContract(config.path);

    const imageLinks: string[] = [];
    const dbResponse = await dbQuery(FETCH_TOKENS_BY_TOKEN_IDS, {
      tokenIds,
    });

    let tokens: Token[] = [];
    if (dbResponse && dbResponse.tokens.length > 0) {
      tokens = dbResponse.tokens;
    }

    for (let tokenId of tokenIds) {
      const loadedTokenAlready = tokens.find(
        (token) => token.token_id === tokenId
      );
      if (loadedTokenAlready) {
        imageLinks.push(loadedTokenAlready.token_metadata.image_url);
      } else {
        const maxTries = 10;
        let tries = 0;

        let cid = "";

        while (!cid && tries < maxTries) {
          try {
            cid = await pieceFactoryContract.tokenURIWithoutPrefix(tokenId);
            tries++;
          } catch (error) {}
        }

        const imageUrl = (await readFileFromIPFS(cid)).image;
        imageLinks.push(imageUrl);
      }
    }

    return res.json({ images: imageLinks });
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching images for token id's: ${error.message}`,
      true
    );
  }
}
