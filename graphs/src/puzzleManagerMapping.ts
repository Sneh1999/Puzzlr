import { BigInt, log, store } from "@graphprotocol/graph-ts";
import { PieceFactory } from "../generated/PieceFactory/PieceFactory";
import {
  ListingCreated,
  ListingDeleted,
  ListingSwapped,
  PackPurchaseCompleted,
  PackPurchaseRequested,
  PackUnboxed,
  PieceMinted,
  PrizeClaimed,
  PuzzleEnded,
  PuzzleManager,
  PuzzleSolved,
  PuzzleStarted,
} from "../generated/PuzzleManager/PuzzleManager";
import { Listing, Pack, Piece, Prize, Puzzle } from "../generated/schema";

export function handlePuzzleStarted(event: PuzzleStarted): void {
  let id =
    event.params.puzzleGroupId.toString() +
    "-" +
    event.params.puzzleId.toString();
  let puzzle = new Puzzle(id);
  puzzle.puzzleGroupId = event.params.puzzleGroupId;
  puzzle.puzzleId = event.params.puzzleId;
  puzzle.maxWinners = event.params.maxWinners;
  puzzle.remainingWinners = event.params.maxWinners;
  puzzle.winners = [];
  puzzle.prizes = [];
  puzzle.type = "PUZZLE_STARTED";
  puzzle.save();
}

export function handlePuzzleSolved(event: PuzzleSolved): void {
  let id =
    event.params.puzzleGroupId.toString() +
    "-" +
    event.params.puzzleId.toString();
  let puzzle = Puzzle.load(id);
  if (puzzle == null) return;

  puzzle.remainingWinners = puzzle.remainingWinners.minus(
    BigInt.fromString("1")
  );

  // NOTE: We have to do array pushes this way - subtlety with The Graph
  let winners = puzzle.winners;
  winners.push(event.params.winner);
  puzzle.winners = winners;

  let prizes = puzzle.prizes;
  prizes.push(event.params.prize);
  puzzle.prizes = prizes;
  puzzle.save();

  let prizeId =
    event.params.winner.toHex() + "-" + event.params.prize.toString();

  let prize = new Prize(prizeId);
  prize.claimed = false;
  prize.winner = event.params.winner;
  prize.prize = event.params.prize;
  prize.save();
}

export function handlePuzzleEnded(event: PuzzleEnded): void {
  let id =
    event.params.puzzleGroupId.toString() +
    "-" +
    event.params.puzzleId.toString();
  let puzzle = Puzzle.load(id);
  if (puzzle == null) return;

  puzzle.type = "PUZZLE_ENDED";
  puzzle.save();
}

export function handlePackPurchaseRequested(
  event: PackPurchaseRequested
): void {
  let id = event.params.requestId.toHex();
  let pack = new Pack(id);
  pack.puzzleGroupId = event.params.puzzleGroupId;
  pack.requestId = event.params.requestId;
  pack.owner = event.params.buyer;
  pack.tier = event.params.tier;
  pack.type = "PACK_PURCHASE_REQUESTED";
  pack.save();
}

export function handlePackPurchaseCompleted(
  event: PackPurchaseCompleted
): void {
  let id = event.params.requestId.toHex();
  let pack = Pack.load(id);
  if (pack == null) return;

  pack.type = "PACK_PURCHASE_COMPLETED";
  pack.save();
}

export function handlePackUnboxed(event: PackUnboxed): void {
  let id = event.params.requestId.toHex();
  let pack = Pack.load(id);
  if (pack == null) return;

  pack.tokenIds = event.params.tokenIds;
  pack.type = "PACK_UNBOXED";
  pack.save();
}

export function handlePieceMinted(event: PieceMinted): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let piece = new Piece(id);
  piece.owner = event.params.owner;
  piece.tokenId = event.params.tokenId;
  piece.piece = event.params.piece;
  piece.save();
}

export function handlePrizeClaimed(event: PrizeClaimed): void {
  let id = event.params.winner.toHex() + "-" + event.params.prize.toString();
  let prize = Prize.load(id);
  prize.claimed = true;
  prize.tokenId = event.params.tokenId;
  prize.save();
}

export function handleListingCreated(event: ListingCreated): void {
  let id =
    event.params.seller.toHex() + "-" + event.params.sellerTokenId.toString();

  let puzzleManagerContract = PuzzleManager.bind(event.address);
  let pieceFactoryAddress = puzzleManagerContract.pieceFactory();
  let pieceFactoryContract = PieceFactory.bind(pieceFactoryAddress);

  let listing = Listing.load(id);
  if (listing === null) listing = new Listing(id);

  let paddedBlockNumber = padString(event.block.number.toString(), 20, "0");
  let paddedLogIndex = padString(event.logIndex.toString(), 20, "0");

  let sellerPiece = pieceFactoryContract.tokenURIWithoutPrefix(
    event.params.sellerTokenId
  );

  let _wantsPieces = listing.wantsPieces;
  if (_wantsPieces === null) _wantsPieces = [];
  _wantsPieces.push(event.params.wants);

  listing.wantsPieces = _wantsPieces;
  listing.seller = event.params.seller;
  listing.sellerTokenId = event.params.sellerTokenId;
  listing.sellerPiece = sellerPiece;
  listing.type = "LISTING_CREATED";
  listing.timestamp = paddedBlockNumber + "-" + paddedLogIndex;
  listing.save();
}

export function handleListingSwapped(event: ListingSwapped): void {
  let id =
    event.params.seller.toHex() + "-" + event.params.sellerTokenId.toString();

  let listing = Listing.load(id);
  if (listing == null) return;

  let paddedBlockNumber = padString(event.block.number.toString(), 20, "0");
  let paddedLogIndex = padString(event.logIndex.toString(), 20, "0");

  let puzzleManagerContract = PuzzleManager.bind(event.address);
  let pieceFactoryAddress = puzzleManagerContract.pieceFactory();
  let pieceFactoryContract = PieceFactory.bind(pieceFactoryAddress);

  let buyerPiece = pieceFactoryContract.tokenURIWithoutPrefix(
    event.params.buyerTokenId
  );

  listing.wantsPieces = [];
  listing.buyer = event.params.buyer;
  listing.buyerTokenId = event.params.buyerTokenId;
  listing.buyerPiece = buyerPiece;
  listing.type = "LISTING_SWAPPED";
  listing.timestamp = paddedBlockNumber + "-" + paddedLogIndex;
  listing.save();
}

export function handleListingDeleted(event: ListingDeleted): void {
  let id =
    event.params.seller.toHex() + "-" + event.params.sellerTokenId.toString();

  let listing = Listing.load(id);
  if (listing == null) return;
  if (listing.wantsPieces == null) return;

  if (event.params.wanted == "all") {
    listing.type = "LISTING_DELETED";
  } else {
    let _wantsPieces: Array<string> = [];
    let listingWantsPieces = listing.wantsPieces as Array<string>;

    for (let i = 0; i < listingWantsPieces.length; i++) {
      if (listingWantsPieces[i].toString() != event.params.wanted.toString()) {
        _wantsPieces.push(listingWantsPieces[i]);
      }
    }

    if (_wantsPieces.length === 0) {
      listing.type = "LISTING_DELETED";
    } else {
      let paddedBlockNumber = padString(event.block.number.toString(), 20, "0");
      let paddedLogIndex = padString(event.logIndex.toString(), 20, "0");

      listing.wantsPieces = _wantsPieces;
      listing.timestamp = paddedBlockNumber + "-" + paddedLogIndex;
    }
  }
  listing.save();
}

function padString(s: string, l: number, c: string): string {
  let newS = s;
  while (newS.length < l) {
    newS = c + newS;
  }
  return newS;
}
