import { FETCH_TRANSFERS_LIMIT } from "../constants";

export function FETCH_TRANSFERS_AFTER_TIMESTAMP(timestamp: string) {
  return `
        query {
            transfers (first: ${FETCH_TRANSFERS_LIMIT}, where: { timestamp_gt: "${timestamp}", type: "PIECE_TRANSFER" }, orderBy: timestamp, orderDirection: asc) {
                id
                from
                to
                tokenId
                type
                timestamp
            }
        }
    `;
}
