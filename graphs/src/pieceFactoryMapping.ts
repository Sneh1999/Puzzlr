import { Transfer } from "../generated/PrizeFactory/PrizeFactory";

import { Transfer as PieceTransfer } from "../generated/schema";

export function handlePieceTransfer(event: Transfer): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let transfer = new PieceTransfer(id);

  let paddedBlockNumber = padString(event.block.number.toString(), 20, "0");
  let paddedLogIndex = padString(event.logIndex.toString(), 20, "0");

  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.tokenId = event.params.tokenId;
  transfer.type = "PIECE_TRANSFER";
  transfer.timestamp = paddedBlockNumber + "-" + paddedLogIndex;
  transfer.save();
}

function padString(s: string, l: number, c: string): string {
  let newS = s;
  while (newS.length < l) {
    newS = c + newS;
  }
  return newS;
}
