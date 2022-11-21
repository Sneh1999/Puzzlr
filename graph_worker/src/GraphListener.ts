import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import pieceFactoryABI from "./abis/PieceFactory.json";
import { Datastore } from "./DataStore";
import { UPSERT_TOKENS } from "./queries/dbQueries";
import { FETCH_TRANSFERS_AFTER_TIMESTAMP } from "./queries/subgraphQueries";
import { subgraphQuery } from "./subgraphQuery";
import { Token } from "./types/Token";
import { TransferEntity } from "./types/TransferEntity";

export class GraphListener {
  private dbFilename: string;
  private db: low.LowdbSync<any>;
  private datastore: Datastore;
  private pieceFactory: Contract;
  private NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

  constructor(_dbFilename: string) {
    this.dbFilename = _dbFilename;
    this.datastore = new Datastore(process.env.HASURA_URL);

    const provider = new JsonRpcProvider(process.env.RPC_URL);

    this.pieceFactory = new Contract(
      process.env.PIECE_FACTORY_ADDRESS,
      pieceFactoryABI,
      provider
    );

    const adapter = new FileSync(this.dbFilename);
    this.db = low(adapter);

    this.db
      .defaults({
        last_timestamp: "00000000000000000000-00000000000000000000",
      })
      .write();
  }

  async poll() {
    try {
      const transferTokens = await this.pollTransfers();
      await this.handleTransfers(transferTokens);

      setTimeout(() => {
        this.poll();
      }, Number(process.env.POLL_INTERVAL));
    } catch (error) {
      console.error(error);
    }
  }

  updateTimestamp(_lastTransferTimestamp: string) {
    this.db.set("last_timestamp", _lastTransferTimestamp).write();
  }

  async pollTransfers(): Promise<TransferEntity[]> {
    const latestTimestamp = this.db.get("last_timestamp").value();
    console.log(`Polling transfers after timestamp ${latestTimestamp}...`);

    const response = await subgraphQuery(
      FETCH_TRANSFERS_AFTER_TIMESTAMP(latestTimestamp)
    );

    const transferEntities = response.transfers as TransferEntity[];

    return transferEntities;
  }

  async getTokenCid(transfer: TransferEntity): Promise<[string, string]> {
    let CID: string;
    try {
      CID = await this.pieceFactory.tokenURIWithoutPrefix(transfer.tokenId);
    } catch (error) {
      return ["-1", "-1"];
    }

    return [transfer.tokenId, CID];
  }

  async handleTransfers(transfers: TransferEntity[]) {
    let tokenIdCids: Record<string, string> = {};
    const promises: Promise<[string, string]>[] = [];

    for (let transfer of transfers) {
      console.log(transfer);
      if (transfer.to !== this.NULL_ADDRESS) {
        promises.push(this.getTokenCid(transfer));
      }
    }

    const results = await Promise.all(promises);

    results.map((result) => {
      if (result[0] !== "-1") {
        tokenIdCids[result[0]] = result[1];
      }
    });

    let tokens: Token[] = [];

    for (let transfer of transfers) {
      const cid = tokenIdCids[transfer.tokenId];

      if (cid) {
        const token = {
          token_id: process.env.ACTIVE_GROUP_ID + "-" + transfer.tokenId,
          owner: transfer.to,
          cid: cid,
          timestamp: transfer.timestamp,
          type: transfer.type,
        };

        tokens.push(token);
      }
    }

    if (tokens.length > 0) {
      try {
        await this.datastore.queryOrMutation(UPSERT_TOKENS, {
          objects: tokens,
        });
      } catch (error) {
        console.log(JSON.stringify(error, null, 2));
      }
    }
    if (transfers.length > 0) {
      this.updateTimestamp(transfers[transfers.length - 1].timestamp);
    }
  }
}
