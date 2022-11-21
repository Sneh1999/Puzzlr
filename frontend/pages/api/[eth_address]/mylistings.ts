import { INITIAL_MAX_TIMESTAMP, LISTINGS_LIMIT } from "constants/constants";
import { ListingEntity } from "models/types/ListingEntity";
import { Puzzle } from "models/types/Puzzle";
import { NextApiRequest, NextApiResponse } from "next";
import {
  FETCH_ALL_LISTINGS_FOR_USER,
  FETCH_LIVE_PUZZLES,
  FETCH_METADATAS_BY_CIDS,
} from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { subgraphQuery } from "utils/subgraphQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }
  let timestamp: string =
    (req.query.timestamp as string) ?? INITIAL_MAX_TIMESTAMP;
  const account = req.query.eth_address as string;
  if (!account) {
    return apiResponse(res, 400, "Account  not provided", true);
  }
  try {
    const listingsActive = await getAllListingsForUser(timestamp, account);
    return res.json(listingsActive);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error getting all the listings : ${error.message}`,
      true
    );
  }
}

export async function getAllListingsForUser(
  timestamp: string,
  account: string
): Promise<ListingEntity[]> {
  const ongoingPuzzleResponse = await dbQuery(FETCH_LIVE_PUZZLES);
  const ongoingPuzzles = ongoingPuzzleResponse.puzzles as Puzzle[];
  const activePieces: string[] = ongoingPuzzles
    .map((puzzle) => puzzle.pieces)
    .flat();

  const listingsForUserResponse = await subgraphQuery(
    FETCH_ALL_LISTINGS_FOR_USER(
      timestamp,
      account,
      activePieces,
      LISTINGS_LIMIT
    )
  );

  const cids: string[] = [];
  const listingsForUser = listingsForUserResponse.listings as ListingEntity[];

  let listingsActive: ListingEntity[] = [];

  let listingWantsPiecesImage: Record<string, string> = {};
  let listingSellerTokenImage: Record<string, string> = {};

  for (let listing of listingsForUser) {
    cids.push(...listing.wantsPieces);
    cids.push(listing.sellerPiece);
  }

  const cidResponse = await dbQuery(FETCH_METADATAS_BY_CIDS, {
    cids: cids,
  });

  for (let listing of listingsForUser) {
    if (!listing.wantsPiecesImages) {
      listing.wantsPiecesImages = [];
    }

    if (!listing.wantsPiecesPuzzleGroupIds) {
      listing.wantsPiecesPuzzleGroupIds = [];
    }

    if (!listing.wantsPiecesPuzzleNames) {
      listing.wantsPiecesPuzzleNames = [];
    }

    let foundWantsCID = false;
    let foundSellerCID = false;
    for (const wantPiece of listing.wantsPieces) {
      for (let metadata of cidResponse.metadata) {
        if (wantPiece === metadata.cid) {
          listing.wantsPiecesImages.push(metadata.image_url);
          listingWantsPiecesImage[wantPiece] = metadata.image_url;
        }

        if (listing.sellerPiece === metadata.cid) {
          listing.sellerTokenIdImage = metadata.image_url;
          listingSellerTokenImage[listing.sellerPiece] = metadata.image_url;
        }
      }

      for (let ongoingPuzzle of ongoingPuzzles) {
        if (
          ongoingPuzzle.pieces.indexOf(wantPiece) >= 0 &&
          listingWantsPiecesImage[wantPiece]
        ) {
          foundWantsCID = true;
          listing.wantsPiecesPuzzleNames.push(ongoingPuzzle.name);
          listing.wantsPiecesPuzzleGroupIds.push(ongoingPuzzle.group_id);
        }

        if (
          ongoingPuzzle.pieces.indexOf(listing.sellerPiece) >= 0 &&
          listingSellerTokenImage[listing.sellerPiece]
        ) {
          foundSellerCID = true;
          listing.sellerTokenPuzzleName = ongoingPuzzle.name;
          listing.sellerTokenPuzzleGroupId = ongoingPuzzle.group_id;
        }
      }
    }

    if (foundWantsCID && foundSellerCID) {
      listingsActive.push(listing);
    }
  }

  return listingsActive;
}
