import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import {
  BuyPackParams,
  ClaimPrizeParams,
  CreateListingParams,
  DeleteListingsParams,
  FulfillListingParams,
  MetatransactionRequest,
  TradeInPiecesForPack,
  TransferPieceParams,
  UnboxPackParams,
} from "models/types/MetatransactionRequest";
import { NextApiRequest, NextApiResponse } from "next";
import { apiResponse } from "utils/apiResponse";
import { recoverPersonalSignature, normalize } from "eth-sig-util";
import { unboxPackForGroupInContract } from "utils/unboxPackForGroupInContract";
import { createNewListingInContract } from "utils/createNewListingInContract";
import { fulfillListingInContract } from "utils/fulfillListingInContract";
import { deleteListingInContract } from "utils/deleteListingInContract";
import { claimPrizeInContract } from "utils/claimPrizeInContract";
import { tradeInPiecesForPackInContract } from "utils/tradeInPiecesForPackInContract";
import { dbQuery } from "utils/dbQuery";
import { DELETE_TOKENS } from "queries/dbQueries";
import gameConfig from "gameConfig";
import { buyPackForGroupInContract } from "utils/buyPackForGroupInContract";
import { transferPieceInContract } from "utils/transferPieceInContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 500, "This HTTP method is not supported", true);
  }

  const metaTxnReq = req.body as MetatransactionRequest;

  if (!metaTxnReq) {
    return apiResponse(res, 400, "Missing request body", true);
  }

  const config = gameConfig[metaTxnReq.game];

  if (!config) {
    return apiResponse(res, 400, "Invalid game", true);
  }

  try {
    console.log(metaTxnReq);
    const verifiedSignature = verifySignature(
      metaTxnReq.ethAddress,
      metaTxnReq.signature
    );
    if (verifiedSignature) {
      let txnHash: string;

      switch (metaTxnReq.action) {
        case EMetatransactionActionType.BUY_PACK:
          txnHash = await handleBuyPackMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as BuyPackParams
          );
          break;
        case EMetatransactionActionType.UNBOX_PACK:
          console.log("I came to unboxing");
          txnHash = await handleUnboxPackMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as UnboxPackParams
          );
          break;
        case EMetatransactionActionType.CREATE_LISTING:
          txnHash = await handleCreateListingMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as CreateListingParams
          );
          break;
        case EMetatransactionActionType.TRANSFER_PIECE:
          txnHash = await handleTransferPieceMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as TransferPieceParams
          );
          break;
        case EMetatransactionActionType.FULFILL_LISTING:
          txnHash = await handleFulfillListingMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as FulfillListingParams
          );
          break;
        case EMetatransactionActionType.DELETE_LISTINGS:
          txnHash = await handleDeleteListingsMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as DeleteListingsParams
          );
          break;
        case EMetatransactionActionType.CLAIM_PRIZE:
          txnHash = await handleClaimPrizeMetatxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as ClaimPrizeParams
          );
          break;
        case EMetatransactionActionType.TRADE_EXPIRED_PIECES:
          txnHash = await handleTradeInPiecesForPackMetaTxn(
            config.path,
            metaTxnReq.ethAddress,
            metaTxnReq.params as TradeInPiecesForPack
          );
          break;
        default:
          return apiResponse(
            res,
            400,
            `Invalid metatransaction request action: ${metaTxnReq.action}`,
            true
          );
      }

      return res.json({ txnHash });
    } else {
      return apiResponse(
        res,
        400,
        `Invalid signature passed for metatransaction`,
        true
      );
    }
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      400,
      `Error sending metatransaction: ${error.message as string}`,
      true
    );
  }
}

export function verifySignature(
  ethAddress: string,
  signature: string
): boolean {
  const msgParams = {
    sig: signature,
    data: LOGIN_SIGNING_MESSAGE,
  };

  const recovered = recoverPersonalSignature(msgParams);
  console.log(`I came here ${normalize(ethAddress) === normalize(recovered)}`);
  return normalize(ethAddress) === normalize(recovered);
}

async function handleBuyPackMetatxn(
  game: string,
  ethAddress: string,
  params: BuyPackParams
): Promise<string> {
  try {
    const config = gameConfig[game];
    const packToPurchase = config.packs.find((p) => p.tier === params.tier);
    if (packToPurchase.price !== 0) {
      throw new Error(`This pack is not free to purchase`);
    }

    const hash = await buyPackForGroupInContract(
      parseInt(params.puzzleGroupId),
      ethAddress,
      params.tier
    );
    return hash;
  } catch (error) {
    throw new Error(`Error sending buy pack metatxn: ${error.message}`);
  }
}

async function handleUnboxPackMetatxn(
  game: string,
  ethAddress: string,
  params: UnboxPackParams
): Promise<string> {
  try {
    const hash = await unboxPackForGroupInContract(game, params.requestId);
    console.log(`Unboxing hash is ${hash}`);
    return hash;
  } catch (error) {
    throw new Error(`Error sending unbox pack metatxn: ${error.message}`);
  }
}

async function handleTransferPieceMetatxn(
  game: string,
  ethAddress: string,
  params: TransferPieceParams
): Promise<string> {
  try {
    if (params.to.toLowerCase() === ethAddress.toLowerCase()) {
      throw new Error(`Cannot transfer piece to yourself`);
    }
    const hash = await transferPieceInContract(
      game,
      ethAddress,
      params.to,
      params.tokenId.split("-").pop()
    );
    return hash;
  } catch (error) {
    throw new Error(`Error sending transfer metatxn: ${error.message}`);
  }
}

async function handleCreateListingMetatxn(
  game: string,
  ethAddress: string,
  params: CreateListingParams
): Promise<string> {
  try {
    const hash = await createNewListingInContract(
      game,
      params.sellerTokenIds.map((tid) => tid.split("-").pop()),
      params.wants,
      ethAddress
    );
    return hash;
  } catch (error) {
    throw new Error(`Error sending create listing metatxn: ${error.message}`);
  }
}

async function handleFulfillListingMetatxn(
  game: string,
  ethAddress: string,
  params: FulfillListingParams
): Promise<string> {
  try {
    const hash = await fulfillListingInContract(
      game,
      params.sellerTokenId.split("-").pop(),
      params.buyerTokenId.split("-").pop(),
      params.seller,
      ethAddress
    );
    return hash;
  } catch (error) {
    throw new Error(`Error sending fulfill listing metatxn: ${error.message}`);
  }
}

async function handleDeleteListingsMetatxn(
  game: string,
  ethAddress: string,
  params: DeleteListingsParams
): Promise<string> {
  try {
    const hash = await deleteListingInContract(
      game,
      params.tokenIds.map((_ids) => _ids.map((tid) => tid.split("-").pop())),
      params.wanted,
      ethAddress
    );
    return hash;
  } catch (error) {
    throw new Error(`Error sending delete listings metatxn: ${error.message}`);
  }
}

async function handleClaimPrizeMetatxn(
  game: string,
  ethAddress: string,
  params: ClaimPrizeParams
): Promise<string> {
  try {
    const hash = await claimPrizeInContract(game, ethAddress, params.puzzleId);
    return hash;
  } catch (error) {
    throw new Error(`Error sending claim prize metatxn: ${error.message}`);
  }
}

async function handleTradeInPiecesForPackMetaTxn(
  game: string,
  ethAddress: string,
  params: TradeInPiecesForPack
) {
  try {
    const config = gameConfig[game];
    if (!config.dropConfig.tradeInEnabled) {
      throw new Error(`Trade-in is not enabled for this game`);
    }
    const hash = await tradeInPiecesForPackInContract(
      game,
      params.pieceIds.map((tid) => tid.split("-").pop()),
      params.packTier,
      params.puzzleGroupId,
      ethAddress
    );
    await dbQuery(DELETE_TOKENS, { pieceIds: params.pieceIds });
    return hash;
  } catch (error) {
    throw new Error(
      `Error trading in pieces for pack in contract: ${error.message}`
    );
  }
}
