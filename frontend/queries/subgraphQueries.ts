export function FETCH_CREATED_PUZZLES() {
  return `query {
    puzzles(first: 5, where:{type:PUZZLE_STARTED}) {
      id
    }
  }
  `;
}

export function FETCH_WINNINGS_FOR_ETH_ADDRESS(eth_address: string) {
  return `
        query {
            prizes(first: 1000, where: { winner: "${eth_address}" }) {
                id
                claimed
                winner
                tokenId
                prize
            }
        }
    `;
}

export function FETCH_PUZZLE_BY_IDS(ids: string[]) {
  return `
  query {
    puzzles(where:{id_in:${JSON.stringify(ids)}}) {
      id
      maxWinners
      remainingWinners
      puzzleGroupId
    }
  }
    `;
}

export function FETCH_ALL_LISTINGS(
  timestamp: string,
  activePieces: string[],
  limit: number
) {
  //            sellerPiece_in: ${JSON.stringify(activePieces)},
  // wantsPiece_in: ${JSON.stringify(activePieces)},
  return `query {
        listings(where: 
          {
            timestamp_gt: "${timestamp}",
            type: LISTING_CREATED
          }, orderBy: timestamp, orderDirection: asc, first: ${limit}) {
            id
            seller
            sellerTokenId
            sellerPiece
            wantsPieces
            buyer
            buyerTokenId
            buyerPiece
            type
            timestamp
            
          }
    }
    `;
}

export function FETCH_ALL_LISTINGS_FOR_USER(
  timestamp: string,
  eth_address: string,
  activePieces: string[],
  limit: number
) {
  return `query {
        listings(where: {
          timestamp_gt: "${timestamp}",
          sellerPiece_in: ${JSON.stringify(activePieces)},
          seller: "${eth_address}",
          type: LISTING_CREATED
        }, orderBy: timestamp, orderDirection: asc, first: ${limit}) {
            id
            seller
            sellerPiece
            sellerTokenId
            wantsPieces
            buyer
            buyerTokenId
            buyerPiece
            type
            timestamp
            
          }
    }
    `;
}

export function FETCH_PACK_PURCHASE_COMPLETEDS_FOR_ETH_ADDRESS(
  eth_address: string
) {
  return `
        query {
            packs (first: 1000, where: { type: PACK_PURCHASE_COMPLETED, owner: "${eth_address}" }) {
                id
                requestId
                owner
                puzzleGroupId
                tokenIds
                type
                tier
            }
        }
    `;
}

export function FETCH_SWAP_HISTORY_FOR_SELLER_ETH_ADDRESS(
  timestamp: string,
  eth_address: string,
  limit: number
) {
  return `
        query {
            listings (where: {
              timestamp_gt: "${timestamp}",
              type: LISTING_SWAPPED,
              seller: "${eth_address}"
            }, orderBy: timestamp, orderDirection: asc, first: ${limit}) {
                id
                seller
                sellerTokenId
                sellerPiece
                wantsPieces
                buyer
                buyerTokenId
                buyerPiece
                type
                timestamp
            }
        }
    `;
}

export function FETCH_SWAP_HISTORY_FOR_BUYER_ETH_ADDRESS(
  timestamp: string,
  eth_address: string,
  limit: number
) {
  return `
        query {
            listings (where: {
              timestamp_gt: "${timestamp}",
              type: LISTING_SWAPPED,
              buyer: "${eth_address}"
            }, orderBy: timestamp, orderDirection: asc, first: ${limit}) {
                id
                seller
                sellerTokenId
                sellerPiece
                wantsPieces
                buyer
                buyerTokenId
                buyerPiece
                type
                timestamp
            }
        }
    `;
}
