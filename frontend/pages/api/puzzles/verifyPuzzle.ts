import { TransactionResponse } from "@ethersproject/providers";
import { IVerifyPuzzleRequest } from "models/interfaces/IVerifyPuzzleRequest";
import { Puzzle } from "models/types/Puzzle";
import { Token } from "models/types/Token";
import { NextApiRequest, NextApiResponse } from "next";
import {
  DECREMENT_WINNERS_FOR_PUZZLE,
  FETCH_LIVE_PUZZLE_BY_ID,
  FETCH_PUZZLE_BY_ID,
  FETCH_PUZZLE_TO_BE_REPLACED,
  FETCH_TOKENS_BY_OWNER,
  UPDATE_COMPLETED_IN_PUZZLE,
  UPDATE_STARTED_IN_PUZZLES,
} from "queries";
import { DELETE_TOKENS } from "queries/dbQueries";
import { apiResponse } from "utils/apiResponse";
import { dbQuery } from "utils/dbQuery";
import { getGameConfigForGroupId } from "utils/getGameConfigForGroupId";
import { replaceOrEndPuzzleInContract } from "utils/replaceOrEndPuzzleInContract";

function verifyOwnerHasPieces(puzzleCIDs: string[], ownerTokens: Token[]) {
  for (let cid of puzzleCIDs) {
    if (ownerTokens.findIndex((token) => token.cid === cid) < 0) {
      return false;
    }
  }
  return true;
}

function verifyPiecesOrder(userPuzzleCIDs: string[], puzzle: Puzzle) {
  let inOrder = true;
  for (let i = 0; i < userPuzzleCIDs.length; i++) {
    if (userPuzzleCIDs[i] !== puzzle.pieces[i]) {
      inOrder = false;
      break;
    }
  }
  return inOrder;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const { puzzleId, puzzleCIDs, winner }: IVerifyPuzzleRequest = req.body;
  if (!puzzleId) {
    return apiResponse(res, 400, "Missing puzzleId", true);
  }

  if (!puzzleCIDs || puzzleCIDs.length === 0) {
    return apiResponse(res, 400, "Missing puzzleCIDs", true);
  }

  try {
    // let dbResponse = await

    const dbResponse = await dbQuery(FETCH_TOKENS_BY_OWNER, {
      owner: winner.toLowerCase(),
    });

    const ownerTokens = dbResponse.tokens as Token[];

    const hasAllPieces = verifyOwnerHasPieces(puzzleCIDs, ownerTokens);
    if (!hasAllPieces) {
      return apiResponse(
        res,
        500,
        `Error verifying the puzzle: User doesnt have all the pieces`,
        true
      );
    }

    const puzzleResponse = await dbQuery(FETCH_PUZZLE_BY_ID, {
      id: puzzleId,
    });
    const puzzle = puzzleResponse.puzzles[0] as Puzzle;

    const isCorrectOrder = verifyPiecesOrder(puzzleCIDs, puzzle);

    if (!isCorrectOrder) {
      return apiResponse(
        res,
        500,
        `Error verifying the puzzle : Puzzle Pieces in incorrect order`,
        true
      );
    }

    const ongoingPuzzleResponse = await dbQuery(FETCH_LIVE_PUZZLE_BY_ID, {
      id: puzzleId,
    });

    const ongoingPuzzle = ongoingPuzzleResponse.puzzles[0] as Puzzle;

    const findReplacementPuzzleResponse = await dbQuery(
      FETCH_PUZZLE_TO_BE_REPLACED,
      {
        group_id: ongoingPuzzle.group_id,
        grid_size: ongoingPuzzle.grid_size,
      }
    );

    const replacementPuzzle = findReplacementPuzzleResponse
      .puzzles[0] as Puzzle;

    let verificationState = 0; // 0 = Solved, 1 = Solved+Ended, 2 = Solved+Ended+Replaced

    // About to end
    if (ongoingPuzzle.remaining_winners <= 1) {
      // Has a replacement
      if (replacementPuzzle) {
        verificationState = 2;
      } else {
        // No replacement
        verificationState = 1;
      }
    } else {
      // Many remaining winners left
      verificationState = 0;
    }

    const config = getGameConfigForGroupId(ongoingPuzzle.group_id);

    let txnResponse: TransactionResponse;
    let tokenIds: string[] = [];
    for (let cid of puzzleCIDs) {
      const t = ownerTokens.find(
        (t) => t.cid === cid && !tokenIds.includes(t.token_id)
      );
      tokenIds.push(t.token_id);
    }

    if (!replacementPuzzle) {
      //End Puzzle
      txnResponse = await replaceOrEndPuzzleInContract(
        ongoingPuzzle.group_id,
        ongoingPuzzle.id,
        winner,
        tokenIds
      );
    } else {
      // Replace Puzzle
      txnResponse = await replaceOrEndPuzzleInContract(
        ongoingPuzzle.group_id,
        ongoingPuzzle.id,
        winner,
        tokenIds,
        replacementPuzzle.id,
        replacementPuzzle.pieces,
        replacementPuzzle.max_winners,
        replacementPuzzle.prizes
      );
    }

    //burn used pieces from DB
    await dbQuery(DELETE_TOKENS, { pieceIds: tokenIds });

    // Parse the logs of transaction response to see what actually happened
    // const txnReceipt = await txnResponse.wait();

    switch (verificationState) {
      // PuzzleSolved
      case 0:
        break;
      // PuzzleSolved + PuzzleEnded
      case 1:
        await dbQuery(UPDATE_COMPLETED_IN_PUZZLE, {
          id: puzzleId,
        });
        break;
      // PuzzleSolved + PuzzleEnded + PuzzleStarted
      case 2:
        await Promise.all([
          dbQuery(UPDATE_STARTED_IN_PUZZLES, {
            idArray: [replacementPuzzle.id],
          }),
          dbQuery(UPDATE_COMPLETED_IN_PUZZLE, {
            id: puzzleId,
          }),
        ]);
        break;
      default:
        throw new Error("unexpected error while parsing txn events");
    }

    // TODO: Validate events are what we expect them to be
    // TODO: Extract helper validation function
    // switch (txnReceipt.logs.length) {
    //   // PuzzleSolved
    //   case 2 + tokenIds.length * 2:
    //     break;
    //   // PuzzleSolved + PuzzleEnded
    //   case 3 + tokenIds.length * 2:
    //     // Mark the current puzzle as completed
    //     await dbQuery(UPDATE_COMPLETED_IN_PUZZLE, {
    //       id: puzzleId,
    //     });
    //     break;
    //   // PuzzleSolved + PuzzleEnded + PuzzleStarted
    //   case 4 + tokenIds.length * 2:
    //     await Promise.all([
    //       dbQuery(UPDATE_STARTED_IN_PUZZLES, {
    //         idArray: [replacementPuzzle.id],
    //       }),
    //       dbQuery(UPDATE_COMPLETED_IN_PUZZLE, {
    //         id: puzzleId,
    //       }),
    //     ]);
    //     break;
    //   default:
    //     throw new Error("unexpected error while parsing txn events");
    // }
    await dbQuery(DECREMENT_WINNERS_FOR_PUZZLE, { id: puzzleId });
    return res.json({
      message: `Congratulations! You've won ${ongoingPuzzle.name}`,
    });
  } catch (error) {
    console.log(error);
    return apiResponse(
      res,
      500,
      `Error verifying the puzzle : ${error.message}`,
      true
    );
  }
}
