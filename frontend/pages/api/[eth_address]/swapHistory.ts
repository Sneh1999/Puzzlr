import { INITIAL_MAX_TIMESTAMP, LISTINGS_LIMIT } from "constants/constants";
import { ListingEntity } from "models/types/ListingEntity";
import { Puzzle } from "models/types/Puzzle";
import { NextApiRequest, NextApiResponse } from "next";
import {
  FETCH_METADATAS_BY_CIDS,
  FETCH_PUZZLES,
  FETCH_SWAP_HISTORY_FOR_BUYER_ETH_ADDRESS,
  FETCH_SWAP_HISTORY_FOR_SELLER_ETH_ADDRESS,
} from "queries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { subgraphQuery } from "utils/subgraphQuery";

async function fetchBoughtListings(
  timestamp: string,
  eth_address: string,
  allPuzzles: Puzzle[]
) {
  try {
    let buyerSideResponse = await subgraphQuery(
      FETCH_SWAP_HISTORY_FOR_BUYER_ETH_ADDRESS(
        timestamp,
        eth_address,
        LISTINGS_LIMIT
      )
    );

    const boughtListings: ListingEntity[] = [];
    const cids: string[] = [];

    boughtListings.push(...buyerSideResponse.listings);

    for (let listing of boughtListings) {
      cids.push(listing.buyerPiece);
      cids.push(listing.sellerPiece);
    }

    const cidResponse = await dbQuery(FETCH_METADATAS_BY_CIDS, {
      cids: cids,
    });

    for (let listing of boughtListings) {
      //setting image URLs to pieces
      for (let metadata of cidResponse.metadata) {
        //buyer pieces
        if (listing.buyerPiece === metadata.cid) {
          listing.buyerPieceImage = metadata.image_url;
        }

        //seller pieces
        if (listing.sellerPiece === metadata.cid) {
          listing.sellerTokenIdImage = metadata.image_url;
        }
      }

      //setting puzzle names to pieces
      for (let puzzle of allPuzzles) {
        //buyer pieces for puzzle
        if (puzzle.pieces.indexOf(listing.buyerPiece) >= 0) {
          listing.buyerPiecePuzzleName = puzzle.name;
          listing.buyerPiecePuzzleGroupId = puzzle.group_id;
        }
        //seller pieces for puzzle
        if (puzzle.pieces.indexOf(listing.sellerPiece) >= 0) {
          listing.sellerTokenPuzzleName = puzzle.name;
          listing.sellerTokenPuzzleGroupId = puzzle.group_id;
        }
      }
    }

    return boughtListings;
  } catch (error) {
    throw error;
  }
}

async function fetchSoldListings(
  timestamp: string,
  eth_address: string,
  allPuzzles: Puzzle[]
) {
  try {
    let sellerSideResponse = await subgraphQuery(
      FETCH_SWAP_HISTORY_FOR_SELLER_ETH_ADDRESS(
        timestamp,
        eth_address,
        LISTINGS_LIMIT
      )
    );

    const soldListings: ListingEntity[] = [];
    const cids: string[] = [];

    soldListings.push(...sellerSideResponse.listings);

    for (let listing of soldListings) {
      cids.push(listing.buyerPiece);
      cids.push(listing.sellerPiece);
    }

    const cidResponse = await dbQuery(FETCH_METADATAS_BY_CIDS, {
      cids: cids,
    });

    for (let listing of soldListings) {
      // setting image URLs
      for (let metadata of cidResponse.metadata) {
        //buyer pieces
        if (listing.buyerPiece === metadata.cid) {
          listing.buyerPieceImage = metadata.image_url;
        }
        //seller pieces
        if (listing.sellerPiece === metadata.cid) {
          listing.sellerTokenIdImage = metadata.image_url;
        }
      }

      // setting puzzle names to pieces
      for (let puzzle of allPuzzles) {
        //buyer pieces for puzzle
        if (puzzle.pieces.indexOf(listing.buyerPiece) >= 0) {
          listing.buyerPiecePuzzleName = puzzle.name;
          listing.buyerPiecePuzzleGroupId = puzzle.group_id;
        }

        //seller pieces for puzzle
        if (puzzle.pieces.indexOf(listing.sellerPiece) >= 0) {
          listing.sellerTokenPuzzleName = puzzle.name;
          listing.sellerTokenPuzzleGroupId = puzzle.group_id;
        }
      }
    }

    return soldListings;
  } catch (error) {
    throw error;
  }
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const eth_address = req.query.eth_address as string;
  if (!eth_address) {
    return apiResponse(res, 400, "eth_address must be provided", true);
  }
  let timestamp: string =
    (req.query.timestamp as string) ?? INITIAL_MAX_TIMESTAMP;

  const type = req.query.type as string;
  try {
    if (!type && type !== "BOUGHT" && type !== "SOLD") {
      return apiResponse(res, 400, "Type must be provided", true);
    }
    const allPuzzlesResponse = await dbQuery(FETCH_PUZZLES);
    const allPuzzles = allPuzzlesResponse.puzzles as Puzzle[];

    if (type === "BOUGHT") {
      const boughtListings = await fetchBoughtListings(
        timestamp,
        eth_address,
        allPuzzles
      );

      return res.json({ boughtListings });
    } else {
      const soldListings: ListingEntity[] = await fetchSoldListings(
        timestamp,
        eth_address,
        allPuzzles
      );
      return res.json({ soldListings });
    }
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching swap history for ${eth_address}: ${error.message}`,
      true
    );
  }
}
