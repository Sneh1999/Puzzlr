import { ICreatePuzzleRequest } from "models/interfaces/ICreatePuzzleRequest";
import { Metadata } from "models/types/Metadata";
import { Puzzle } from "models/types/Puzzle";
import { CREATE_PUZZLE, INSERT_METADATAS } from "queries";
import { dbQuery } from "./dbQuery";
import { downloadImage } from "./downloadImage";
import { sliceImage } from "./sliceImage";
import { IPFSUploadResult, uploadFilesToIPFS } from "./uploadFilesToIPFS";

export async function createPuzzleInDatabase(
  cpr: ICreatePuzzleRequest
): Promise<Puzzle> {
  console.log(
    `Creating puzzle ${cpr.name}... Uploading ${
      cpr.gridSize * cpr.gridSize + 1
    } files to IPFS`
  );

  const hasMultipleWinners = cpr.maxWinners > 1;

  try {
    const downloadedImageBuffer = await downloadImage(cpr.imageUrl);
    const slicedPieces = await sliceImage(downloadedImageBuffer, cpr.gridSize);

    let prizesResult: IPFSUploadResult[] = [];

    if (!hasMultipleWinners) {
      // Single winner
      // If `prizes` is present:
      if (cpr.prizes && cpr.prizes.length === 1) {
        const prizeImageBuffer = await downloadImage(cpr.prizes[0]);
        prizesResult = await uploadFilesToIPFS(
          [prizeImageBuffer],
          cpr.name,
          cpr.description
        );
      } else {
        prizesResult = await uploadFilesToIPFS(
          [downloadedImageBuffer],
          cpr.name,
          cpr.description
        );
      }
    } else {
      // Multiple winners
      // if `prizes` is present and same length as maxWinners
      if (cpr.prizes && cpr.prizes.length === cpr.maxWinners) {
        const imageBuffers: Buffer[] = [];
        for (const p of cpr.prizes) {
          imageBuffers.push(await downloadImage(p));
        }

        console.log(`Uploading ${imageBuffers.length} prizes to IPFS...`);
        prizesResult = await uploadFilesToIPFS(
          imageBuffers,
          cpr.name,
          cpr.description
        );
      } else if (cpr.prizes && typeof cpr.prizes === "string") {
        let prizeBuffer = await downloadImage(cpr.prizes);
        let singlePrizeResult = await uploadFilesToIPFS(
          [prizeBuffer],
          cpr.name,
          cpr.description
        );
        for (let x = 0; x < cpr.maxWinners; x++) {
          prizesResult.push(singlePrizeResult[0]);
        }
      } else if (!cpr.prizes) {
        // If prizes is not present
        let singlePrizeResult = await uploadFilesToIPFS(
          [downloadedImageBuffer],
          cpr.name,
          cpr.description
        );
        for (let x = 0; x < cpr.maxWinners; x++) {
          prizesResult.push(singlePrizeResult[0]);
        }
      } else {
        // Prizes is present but not same length as maxWinners
        throw new Error(`Prizes array not same length as maximum winners`);
      }
    }

    const piecesResult = await uploadFilesToIPFS(
      slicedPieces,
      `${cpr.name} - Piece`,
      cpr.description
    );

    const artworkResult = await uploadFilesToIPFS(
      [downloadedImageBuffer],
      `${cpr.name} - Piece`,
      cpr.description
    );
    let artwork = artworkResult[0].image_url.split("/").pop();
    const dbResponse = await dbQuery(CREATE_PUZZLE, {
      name: cpr.name,
      description: cpr.description,
      grid_size: cpr.gridSize,
      group_id: cpr.groupId,
      artwork: artwork,
      max_winners: cpr.maxWinners,
      // Postgres array format is {abc,def} for a JSON array ["abc", "def"]
      pieces: `{${piecesResult.map((x) => x.cid).join(",")}}`,
      prizes: `{${prizesResult.map((x) => x.cid).join(",")}}`,
    });

    const uniquePieces = Object.fromEntries(
      piecesResult.map((piece) => [piece.cid, piece])
    );

    const uniquePrizes = Object.fromEntries(
      prizesResult.map((prize) => [prize.cid, prize])
    );

    const metadataObjects: Metadata[] = Object.values(uniquePieces).map(
      (piece) => ({
        cid: piece.cid,
        name: piece.name,
        description: piece.description,
        image_url: piece.image_url,
      })
    );

    metadataObjects.push(
      ...Object.values(uniquePrizes).map((prize) => ({
        cid: prize.cid,
        name: prize.name,
        description: prize.description,
        image_url: prize.image_url,
      }))
    );

    await dbQuery(INSERT_METADATAS, {
      objects: metadataObjects,
    });

    return dbResponse.insert_puzzles.returning[0] as Puzzle;
  } catch (error) {
    console.error(error);
    throw new Error(`Error creating puzzle in database: ${error.message}`);
  }
}
