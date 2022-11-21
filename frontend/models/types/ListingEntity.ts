import { EListingEventType } from "models/enums/EListingEventType";

export type ListingEntity = {
  id: string;
  seller: string;
  sellerTokenId: string;
  sellerPiece: string;
  sellerTokenIdImage?: string;
  sellerTokenPuzzleName?: string;
  sellerTokenPuzzleGroupId?: number;
  wantsPieces: string[];
  wantsPiecesImages?: string[];
  wantsPiecesPuzzleNames?: string[];
  wantsPiecesPuzzleGroupIds?: number[];
  buyer?: string;
  buyerTokenId?: string;
  buyerPiece?: string;
  buyerPieceImage?: string;
  buyerPiecePuzzleName?: string;
  buyerPiecePuzzleGroupId?: number;
  type: EListingEventType;
  timestamp: string;
};
