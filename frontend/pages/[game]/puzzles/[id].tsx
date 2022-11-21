import { Web3Provider } from "@ethersproject/providers";
import { CheckCircleIcon } from "@heroicons/react/outline";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { useWeb3React } from "@web3-react/core";
import { hasuraClient } from "apiClients/hasuraClient";
import axios from "axios";
import clsx from "clsx";
import { Button } from "components/Button";
import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { GradientTitle } from "components/GradientTitle";
import { LoadingIndicator } from "components/LoadingIndicator";
import { Modal } from "components/Modal";
import { PageSectionTitle } from "components/PageSectionTitle";
import gameConfig from "gameConfig";
import type { Token } from "models/types/Token";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { FETCH_PUZZLE_BY_ID } from "queries";
import {
  Dispatch,
  DragEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import ReCAPTCHA from "react-google-recaptcha";
import type { ILiveRemainingWinnersPuzzlesStore } from "stores/useLiveRemainingWinnersPuzzles";
import { useLiveRemainingWinnersPuzzles } from "stores/useLiveRemainingWinnersPuzzles";
import { HasuraNS } from "types";
import { dbQuery } from "utils/dbQuery";
import { getIPFSGatewayLink } from "utils/getIPFSGatewayLink";

const MIME_TEXT = "text/plain";
const UNUSED_PIECE_ID_PREFIX = "unused-piece";
const BOARD_PIECE_ID_PREFIX = "board-piece";
const EMPTY_PIECE: Token = {
  cid: "",
  owner: "",
  timestamp: "",
  token_id: "",
  type: "",
  token_metadata: {
    name: "",
    description: "",
    image_url: "",
    attributes: {},
  },
};
const PIECES_SCROLL_Y_THRESHOLD = -225;

interface PuzzleBoardProps {
  puzzleId: number;
  boardPieces: Token[];
  gridSize: number;
  onDrop: (e: DragEvent) => void;
}

interface UnusedPiecesProps {
  unusedPieces: Token[];
  loading: boolean;
  onDrop: (e: DragEvent) => void;
}

interface VerifyPuzzle {
  verificationLoading: boolean;
  verifyPuzzle: () => Promise<void>;
}

interface ModalContentProps {
  type: ModalContentType;
  path: string;
  name: string;
  errorMessage: string;
}

type ModalContentType = "success" | "error" | "none";

const remainingWinnersText = (remainingWinners: number | undefined): string => {
  // if (remainingWinners === undefined || remainingWinners < 0) {
  //   return "";
  // }
  return "";
  // switch (remainingWinners) {
  //   case 0:
  //     return "(No prize left)";
  //   case 1:
  //     return "(1 prize left)";
  //   default:
  //     return `(${remainingWinners} prizes left)`;
  // }
};

const ModalContent: React.FC<ModalContentProps> = ({
  errorMessage,
  name,
  path,
  type,
}) => (
  <>
    {type === "success" ? (
      <SuccessModalContent path={path} name={name} />
    ) : null}
    {type === "error" ? (
      <ErrorModalContent errorMessage={errorMessage} />
    ) : null}
  </>
);

const SuccessModalContent: React.FC<{ name: string; path: string }> = ({
  name,
  path,
}) => (
  <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
    <h2 className="text-center font-semibold text-2xl mt-2">
      🔥 Verification Successful
    </h2>
    <div className="mt-4 flex justify-center">
      <img src="/success.png" />
    </div>
    <p className="text-center font-light my-5">
      Congratulations! You've successfully solved {name}.
    </p>
    <Link
      href={{
        pathname: "/[game]/winnings",
        query: {
          game: path,
        },
      }}
    >
      <Button className="mt-4">View Winnings</Button>
    </Link>
  </div>
);

const ErrorModalContent: React.FC<{ errorMessage: string }> = ({
  errorMessage,
}) => (
  <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
    <h2 className="text-center font-semibold text-2xl mt-2">
      😥 Verification Unsuccessful
    </h2>
    <div className="mt-4 flex justify-center">
      <img src="/failure.png" />
    </div>
    <p className="pt-4 text-base text-center font-light">{errorMessage}</p>
  </div>
);

const onDrag = (e: DragEvent<HTMLImageElement>) => {
  e.dataTransfer.setData(MIME_TEXT, (e.target as Element).id);
  e.dataTransfer.effectAllowed = "move";
};

const allowDrop = (e: DragEvent) => e.preventDefault();

const UnusedPiecesContainer: React.FC<{ onDrop: (e: DragEvent) => void }> = ({
  onDrop,
  children,
}) => (
  <div
    id={`${UNUSED_PIECE_ID_PREFIX}-container`}
    className="flex items-center px-4 my-4 h-40 rounded-2xl bg-gray-800"
    onDrop={onDrop}
    onDragOver={allowDrop}
  >
    {children}
  </div>
);

const PuzzleContainer: React.FC = ({ children }) => (
  <div className="my-8 aspect-w-1 aspect-h-1">{children}</div>
);

const CompletedPuzzleArtWork: React.FC<{ imgSrc: string }> = ({ imgSrc }) => (
  <PuzzleContainer>
    <img className="w-full object-cover" src={imgSrc} />
  </PuzzleContainer>
);

const UnusedPieces: React.FC<UnusedPiecesProps> = ({
  unusedPieces,
  loading,
  onDrop,
}) => {
  return (
    <UnusedPiecesContainer onDrop={onDrop}>
      {loading ? (
        <div className="flex flex-grow items-center justify-center">
          <LoadingIndicator />
        </div>
      ) : unusedPieces?.length > 0 ? (
        <div className="flex space-x-4 overflow-x-auto">
          {unusedPieces.map((p, i) => (
            <img
              key={i}
              src={p.token_metadata.image_url}
              id={`${UNUSED_PIECE_ID_PREFIX}-${i}`}
              className="h-32 rounded-md shadow"
              data-token-id={p.token_id}
              draggable="true"
              onDragStart={onDrag}
            />
          ))}
        </div>
      ) : (
        unusedPieces !== undefined && <NoUnusedPieces />
      )}
    </UnusedPiecesContainer>
  );
};

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  puzzleId,
  boardPieces,
  gridSize,
  onDrop,
}) => {
  const { account } = useWeb3React<Web3Provider>();

  const [cols, setCols] = useState(0);
  useEffect(() => {
    setCols(gridSize);
  }, [gridSize]);

  return (
    <PuzzleContainer>
      <div className={`grid grid-cols-${cols}`}>
        {boardPieces.map((p, i) => (
          <div className="aspect-w-1 aspect-h-1" key={`${p.token_id}-${i}`}>
            <div
              className="border border-white"
              id={`${BOARD_PIECE_ID_PREFIX}-${i}`}
              style={
                p.token_metadata.image_url
                  ? {
                      backgroundImage: `url('${p.token_metadata.image_url}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }
                  : null
              }
              onDrop={(e: DragEvent) => {
                onDrop(e);
                hasuraClient.insertUserEvent("dropped_piece", account, {
                  drop_target: "board",
                  puzzle_id: puzzleId,
                });
              }}
              onDragOver={allowDrop}
              draggable="true"
              onDragStart={onDrag}
            />
          </div>
        ))}
      </div>
    </PuzzleContainer>
  );
};

const VerifyPuzzle: React.FC<VerifyPuzzle> = ({
  verificationLoading,
  verifyPuzzle,
}) => (
  <div className="flex flex-col items-center">
    {/* <ReCAPTCHA
      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      onChange={onReCAPTCHAChange}
      theme="dark"
    /> */}
    <Button
      className="mt-4 mb-12"
      disabled={false}
      type="border-gradient"
      loading={verificationLoading}
      onClick={verifyPuzzle}
    >
      Verify Puzzle
    </Button>
  </div>
);

const NoUnusedPieces: React.FC = () => (
  <h4 className="flex-grow text-center text-2xl uppercase font-medium text-gray-400">
    No Unused Pieces
  </h4>
);

const liveRemainingWinnersPuzzlesSelector = (
  store: ILiveRemainingWinnersPuzzlesStore
) => ({
  liveRemainingWinnersPuzzles: store.liveRemainingWinnersPuzzles,
  subscribe: store.subscribe,
  unsubscribe: store.unsubscribe,
});

export default function Puzzle({
  puzzle,
  config,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { account, library } = useWeb3React<Web3Provider>();
  const router = useRouter();
  const puzzleId = router.query.id as string;
  const boardId = `${account}-${puzzleId}`;
  const isConnected = typeof account === "string" && !!library;
  const [verifyPuzzleDisabledCaptcha, setVerifyPuzzleDisabledCaptcha] =
    useState(true);
  const [verifyPuzzleClicked, setVerifyPuzzleClicked] = useState(false);
  const [verifyPuzzleDisabled, setVerifyPuzzleDisabled] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [unusedPiecesLoading, setUnusedPiecesLoading] = useState(true);
  const [uriEncodedShare, setUriEncodedShare] = useState<string>();

  const [ownedPieces, setOwnedPieces] = useState<Token[]>();
  const [unusedPieces, setUnusedPieces] = useState<Token[]>();
  const [boardPieces, setBoardPieces] = useState<Token[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [modalContentType, setModalContentType] =
    useState<ModalContentType>("none");
  const [positionPiecesFixed, setPositionPiecesFixed] = useState(false);
  const [remainingWinners, setRemainingWinners] = useState<
    number | undefined
  >();
  const { liveRemainingWinnersPuzzles, subscribe, unsubscribe } =
    useLiveRemainingWinnersPuzzles(liveRemainingWinnersPuzzlesSelector);

  useScrollPosition(({ currPos }) => {
    if (
      currPos.y < PIECES_SCROLL_Y_THRESHOLD &&
      !positionPiecesFixed &&
      unusedPieces &&
      unusedPieces.length > 0
    ) {
      setPositionPiecesFixed(true);
    } else if (currPos.y > PIECES_SCROLL_Y_THRESHOLD && positionPiecesFixed) {
      setPositionPiecesFixed(false);
    }
  });

  useEffect(() => {
    if (unusedPieces?.length === 0) {
      setPositionPiecesFixed(false);
    }
  }, [unusedPieces]);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const p = liveRemainingWinnersPuzzles.find(
      (p) => p.id.toString() === puzzleId
    );
    if (p) {
      setRemainingWinners(p.remaining_winners);
    }
  }, [liveRemainingWinnersPuzzles]);

  useEffect(() => {
    if (puzzleId && account) {
      setUriEncodedShare(uriEncodedShare);

      // Second, fetch owned pieces for puzzle and remove duplicates
      fetchPieces(puzzleId).then((tokens) => {
        let groupByTokens: Record<string, Token[]> = {};
        tokens.reduce((result, token) => {
          if (result[token.cid]) {
            result[token.cid].push(token);
          } else {
            result[token.cid] = [token];
          }
          return result;
        }, groupByTokens);
        const ownedPieces = Object.entries(groupByTokens)
          .map(([cid, tokens]) => {
            if (puzzle.duplicates[cid]) {
              // keep all the tokens up to the maximum duplicate count
              const dedupedTokens = tokens.slice(0, puzzle.duplicates[cid]);
              return [cid, dedupedTokens];
            } else {
              // only keep the first token
              return [cid, [tokens[0]]];
            }
          })
          .flatMap(([_, tokens]) => tokens as Token[]);
        setOwnedPieces(ownedPieces);

        // First, set the board pieces
        const board = localStorage.getItem(boardId) as string;
        if (board) {
          let boardPieces = JSON.parse(board) as Token[];
          boardPieces = boardPieces.map((bp) => {
            if (
              ownedPieces.findIndex((op) => op.token_id === bp.token_id) > -1
            ) {
              return bp;
            } else {
              return EMPTY_PIECE;
            }
          });
          localStorage.setItem(boardId, JSON.stringify(boardPieces));
          setBoardPieces(boardPieces);
        } else {
          const newBoard = new Array(puzzle.gridSize ** 2);
          newBoard.fill(EMPTY_PIECE);
          localStorage.setItem(boardId, JSON.stringify(newBoard));
          setBoardPieces(newBoard);
        }
      });
    }
  }, [puzzleId, account]);

  useEffect(() => {
    if (ownedPieces) {
      calculateUnusedPieces();
      setUnusedPiecesLoading(false);
    }
  }, [boardPieces, ownedPieces]);

  const calculateUnusedPieces = () => {
    const boardTokenIds = new Set(boardPieces.map((p) => p.token_id));
    setUnusedPieces(
      ownedPieces.filter((piece) => !boardTokenIds.has(piece.token_id))
    );
  };

  async function fetchPieces(puzzleId: string): Promise<Token[]> {
    try {
      const response = await axios.get<Token[]>(
        `/api/${account}/puzzles/${puzzleId}/pieces`
      );

      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  const updateBoard = (idx: number, piece: Token) => {
    const board = JSON.parse(localStorage.getItem(boardId) as string);
    board[idx] = piece;
    localStorage.setItem(boardId, JSON.stringify(board));
    setBoardPieces(board);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const draggedElId = e.dataTransfer.getData(MIME_TEXT);
    const dropTargetElId = (e.target as Element).id;

    if (
      draggedElId.startsWith(BOARD_PIECE_ID_PREFIX) &&
      dropTargetElId.startsWith(UNUSED_PIECE_ID_PREFIX)
    ) {
      let boardIdx = Number(draggedElId.split("-")[2]);
      updateBoard(boardIdx, EMPTY_PIECE);
    } else if (
      draggedElId.startsWith(UNUSED_PIECE_ID_PREFIX) &&
      dropTargetElId.startsWith(BOARD_PIECE_ID_PREFIX)
    ) {
      let boardIdx = Number(dropTargetElId.split("-")[2]);
      const unusedPieceTokenId =
        document.getElementById(draggedElId).dataset.tokenId;
      const unusedPieceIdx = unusedPieces.findIndex(
        (p) => p.token_id === unusedPieceTokenId
      );
      updateBoard(boardIdx, unusedPieces[unusedPieceIdx]);
    } else if (
      draggedElId.startsWith(BOARD_PIECE_ID_PREFIX) &&
      dropTargetElId.startsWith(BOARD_PIECE_ID_PREFIX)
    ) {
      const draggedIdx = Number(draggedElId.split("-")[2]);
      const dropIdx = Number(dropTargetElId.split("-")[2]);
      if (draggedIdx !== dropIdx) {
        updateBoard(dropIdx, boardPieces[draggedIdx]);
        updateBoard(draggedIdx, EMPTY_PIECE);
      }
    }
  };

  const onReCAPTCHAChange = (token: string): void => {
    axios.post("/api/verifyReCAPTCHA", { token }).then((response) => {
      setVerifyPuzzleDisabledCaptcha(!response.data);
    });
  };

  const verifyPuzzle = async () => {
    setShowModal(true);
    setModalContentType("none");
    setVerificationLoading(true);
    try {
      const puzzleCIDs = boardPieces.map((piece) => piece.cid);
      await axios.post("/api/puzzles/verifyPuzzle", {
        puzzleId,
        puzzleCIDs,
        winner: account,
      });
      setVerificationLoading(false);
      setModalContentType("success");
    } catch (e) {
      console.error(e);
      setVerifyPuzzleClicked(false);
      if (e.response && e.response.data) {
        setErrorMessage(e.response.data.message);
      } else {
        setErrorMessage(e.message);
      }
      setVerificationLoading(false);
      setModalContentType("error");
    } finally {
      setVerifyPuzzleClicked(false);
    }
  };

  return (
    <>
      {!isConnected ? (
        <div className="mt-8">
          <EmptyAndErrorState
            image="/wallet.png"
            alt="Please sign in"
            message="Please sign in to start solving puzzles"
          />
        </div>
      ) : (
        <div className="px-12 mt-12 max-w-screen-2xl mx-auto">
          <div
            className={clsx({
              "block h-52": positionPiecesFixed,
              hidden: !positionPiecesFixed,
            })}
          />
          <div
            className={clsx("mb-4", {
              "fixed bottom-2 z-10 pr-24 w-2/4": positionPiecesFixed,
            })}
          >
            <PageSectionTitle className={clsx({ hidden: positionPiecesFixed })}>
              Unused Pieces
            </PageSectionTitle>
            <UnusedPieces
              unusedPieces={unusedPieces}
              loading={unusedPiecesLoading}
              onDrop={onDrop}
            />
          </div>
          <div className="flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-20 md:pt-4">
            <div className="w-full md:flex-grow">
              <div className="flex justify-between items-baseline">
                <GradientTitle>{puzzle.name}</GradientTitle>
                <span className="font-semibold text-xl text-gray-500">
                  {config.path === "animetas"
                    ? ""
                    : remainingWinnersText(remainingWinners)}
                </span>
              </div>
              <CompletedPuzzleArtWork imgSrc={puzzle.imgSrc} />
            </div>
            <div className="w-full order-first md:flex-grow md:order-last">
              <GradientTitle className="md:ml-auto">Your Board</GradientTitle>
              <PuzzleBoard
                puzzleId={Number(puzzleId)}
                boardPieces={boardPieces}
                gridSize={puzzle.gridSize}
                onDrop={onDrop}
              />
              <VerifyPuzzle
                verificationLoading={verificationLoading}
                verifyPuzzle={verifyPuzzle}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        loading={verificationLoading}
        isOpen={showModal && !verifyPuzzleClicked}
        onClose={() => setShowModal(false)}
      >
        <ModalContent
          type={modalContentType}
          name={puzzle.name}
          path={config.path}
          errorMessage={errorMessage}
        />
      </Modal>
      <Modal
        loading={verificationLoading}
        isOpen={showModal && verifyPuzzleClicked}
        onClose={() => setShowModal(false)}
      ></Modal>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const config = gameConfig[params.game as string];
  if (!config) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const response = await dbQuery(FETCH_PUZZLE_BY_ID, { id: params.id });
  const [puzzle] = response.puzzles as HasuraNS.Puzzle[];
  // TODO: handle missing puzzle (show 404 puzzle page?)
  let duplicates: Record<string, number> = {};
  puzzle.pieces.reduce((result, piece) => {
    if (result[piece]) {
      result[piece]++;
    } else {
      result[piece] = 1;
    }
    return result;
  }, duplicates);
  duplicates = Object.fromEntries(
    Object.entries(duplicates).filter(([_, count]) => count > 1)
  );
  return {
    props: {
      puzzle: {
        gridSize: puzzle["grid_size"],
        imgSrc: getIPFSGatewayLink(puzzle.artwork),
        name: puzzle["name"],
        duplicates,
      },
      config,
    },
  };
};
