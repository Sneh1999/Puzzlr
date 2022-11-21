import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";

export type MetatransactionRequest = {
  game: string;
  action: EMetatransactionActionType;
  params:
    | BuyPackParams
    | UnboxPackParams
    | CreateListingParams
    | FulfillListingParams
    | DeleteListingsParams
    | ClaimPrizeParams
    | TradeInPiecesForPack
    | TransferPieceParams;
  ethAddress: string;
  signature: string;
};

export type BuyPackParams = {
  puzzleGroupId: string;
  tier: number;
};

export type UnboxPackParams = {
  requestId: string;
};

export type TradeInPiecesForPack = {
  pieceIds: string[];
  packTier: number;
  puzzleGroupId: string;
};

export type CreateListingParams = {
  sellerTokenIds: string[];
  wants: string;
};

export type FulfillListingParams = {
  sellerTokenId: string;
  buyerTokenId: string;
  seller: string;
};

export type DeleteListingsParams = {
  tokenIds: string[][];
  wanted: string[];
};

export type ClaimPrizeParams = {
  puzzleId: string;
};

export type TransferPieceParams = {
  to: string;
  tokenId: string;
};
