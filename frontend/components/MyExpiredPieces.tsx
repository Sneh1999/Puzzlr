import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { PIECES_PER_PAGE } from "constants/constants";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import usePersonalSign from "hooks/usePersonalSign";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { Piece } from "models/types/Piece";
import { useEffect, useState } from "react";
import { sliceArrayIntoChunks } from "utils/sliceArrayInChunks";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";
import { Button } from "./Button";
import { EmptyAndErrorState } from "./EmptyAndErrorState";
import { FailureModal } from "./FailureModal";
import { GradientModal } from "./GradientModal";
import { ImageCard } from "./ImageCard";
import { LoadingIndicator } from "./LoadingIndicator";
import { Modal } from "./Modal";
import { PageSectionTitle } from "./PageSectionTitle";
import { Pagination } from "./Pagination";
import { SuccessModal } from "./SuccessModal";

interface Props {
  config: IGameConfig;
}

export const MyExpiredPieces: React.FC<Props> = ({ config }) => {
  const { account, library } = useWeb3React();
  const personalSign = usePersonalSign();

  const [piecesPageNum, setPiecesPageNum] = useState(1);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Only for Trade-In
  // Index of pack in packs array in game config
  const [tradeInChosenPack, setTradeInChosenPack] = useState<number>();
  const [tradeInRequiredPieceIds, setTradeInRequiredPieceIds] = useState([]);
  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [showBurnInfo, setShowBurnInfo] = useState(false);
  const [showTradeInModal, setShowTradeInModal] = useState(false);
  const [showBurnSuccess, setShowBurnSuccess] = useState(false);
  const minimumPiecesForTradeIn =
    config.packs.length > 0
      ? config.packs.reduce((prev, curr) =>
          prev.tradeInPrice < curr.tradeInPrice ? prev : curr
        ).tradeInPrice
      : -1;

  const isConnected = typeof account === "string" && !!library;

  const fetchExpiredPieces = async () => {
    try {
      const { data: expiredPieces } = await axios.get<Piece[]>(
        `/api/${account}/expiredpieces`
      );
      const filteredPieces = expiredPieces.filter(
        (p) => p.puzzle_group_id === config.dropConfig.activePuzzleGroup
      );

      if (config.dropConfig.tradeInEnabled) {
        calculateBestPossibleTradeIn(filteredPieces);
      }

      setPieces(filteredPieces);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateBestPossibleTradeIn = (pieces: Piece[]) => {
    const pieceIds = pieces.map((p) => p.token_id);
    if (pieceIds.length === 0) return;

    let chosenPackNumber: number;
    const modMap = new Map<string, number>();

    for (const pack of config.packs) {
      const dividend = pack.tradeInPrice;
      const modValue = pieceIds.length % dividend;
      modMap.set(pack.name, modValue);
      if (modValue === 0) {
        chosenPackNumber = config.packs.indexOf(pack);
      }
    }

    let chosenTierName: string = config.packs[0].name;
    if (!chosenPackNumber) {
      for (const modKey of modMap.keys()) {
        if (modMap.get(modKey) < modMap.get(chosenTierName)) {
          chosenTierName = modKey;
        }
      }
      chosenPackNumber = config.packs.findIndex(
        (p) => p.name === chosenTierName
      );
    }

    setTradeInChosenPack(chosenPackNumber);

    const maxPossiblePacks = Math.floor(
      pieceIds.length / config.packs[chosenPackNumber].tradeInPrice
    );
    const requiredPieceIdsForTradeIn = pieceIds.slice(
      0,
      maxPossiblePacks * config.packs[chosenPackNumber].tradeInPrice
    );

    setTradeInRequiredPieceIds(requiredPieceIdsForTradeIn);
  };

  const handleTradeIn = async () => {
    try {
      setTradeInProgress(true);

      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Make metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.TRADE_EXPIRED_PIECES,
        params: {
          pieceIds: tradeInRequiredPieceIds,
          packTier: config.packs[tradeInChosenPack].tier,
          puzzleGroupId: config.dropConfig.activePuzzleGroup,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });

      // Wait for txn to be mined
      await waitForTransactionByHash(library, response.data.txnHash);

      // Show success modal
      setShowBurnSuccess(true);

      // Refetch expired pieces
      await fetchExpiredPieces();
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setTradeInProgress(false);
    }
  };

  useEffect(() => {
    account && fetchExpiredPieces();
  }, [account]);

  return (
    <>
      <div id="expired-pieces">
        <div className="flex justify-between">
          <PageSectionTitle>Expired Pieces</PageSectionTitle>
          {config.dropConfig.tradeInEnabled &&
            !!pieces &&
            pieces.length >= minimumPiecesForTradeIn && (
              <div className="flex">
                <Button
                  className="mr-6"
                  type="border-gradient"
                  size="base"
                  loading={showTradeInModal}
                  onClick={() => {
                    setShowTradeInModal(true);
                  }}
                >
                  Trade in expired pieces
                </Button>
                <img
                  className="cursor-pointer"
                  src={"/info.png"}
                  onClick={() => {
                    setShowBurnInfo(true);
                  }}
                />
              </div>
            )}
        </div>

        {!isConnected ? (
          <div className="my-16 mx-auto">
            <EmptyAndErrorState
              image="/wallet.png"
              alt="Sign in"
              message="Please sign in to view your pieces"
            />
          </div>
        ) : loading ? (
          <div className="py-32">
            <LoadingIndicator />
          </div>
        ) : pieces.length === 0 ? (
          <div className="my-16 flex justify-center">
            <EmptyAndErrorState
              image="/hand.png"
              alt="No expired pieces available"
              message="No expired pieces available"
            />
          </div>
        ) : (
          <div className="my-8">
            {account && (
              <>
                <div className="flex space-x-4 justify-between">
                  {sliceArrayIntoChunks(pieces, PIECES_PER_PAGE)[
                    piecesPageNum - 1
                  ].map((piece: Piece) => (
                    <ImageCard
                      blurred
                      key={piece.token_id.split("-").pop()}
                      src={piece.token_metadata.image_url}
                      title={piece.puzzle_name}
                      subtitle={`Token ID: ${piece.token_id.split("-").pop()}`}
                      showDivider={true}
                      height={300}
                      width={300}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <Pagination
                    pageCount={Math.ceil(pieces.length / PIECES_PER_PAGE)}
                    value={piecesPageNum}
                    onPageChange={setPiecesPageNum}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <FailureModal
        header="Network Error"
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        {errorMessage}
      </FailureModal>
      {config.dropConfig.tradeInEnabled && (
        <>
          <SuccessModal
            header="Trade-In Successful"
            isOpen={showBurnSuccess}
            onClose={() => setShowBurnSuccess(false)}
          >
            You have successfully traded-in your expired pieces!
          </SuccessModal>

          {/* Burn Info Modal */}
          <Modal isOpen={showBurnInfo} onClose={() => setShowBurnInfo(false)}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h2 className="text-center font-semibold text-2xl mt-2">
                🔥 How does the piece-burn work?
              </h2>
              <div className="mt-4 flex justify-center"></div>
              <p className="pt-4 text-base text-center font-light">
                <div className="flex flex-col text-indigo-200">
                  {config.packs.map((pack) => (
                    <span key={pack.tier}>
                      Burn {pack.tradeInPrice} pieces &#8594; 1 {pack.name} pack
                    </span>
                  ))}
                </div>
                <br />
                <span>
                  The algorithm takes your total number of expired pieces and
                  finds the scenario where it can burn the most number of pieces
                  and returns the pack type accordingly.
                </span>
              </p>
            </div>
          </Modal>

          {/* Trade In Modal */}
          {pieces && pieces.length > 0 && (
            <GradientModal
              heading="Confirm Trade-In"
              subheading="Trade in your expired pieces to get fresh pack(s)"
              loadingButton={tradeInProgress}
              isOpen={showTradeInModal}
              onClose={() => setShowTradeInModal(false)}
              onConfirm={handleTradeIn}
              confirmBtnText="Confirm Trade"
            >
              {!loading && (
                <div className="text-left px-8 my-8">
                  <div>
                    <div className="my-6">
                      <h3 className="my-1">You have</h3>
                      <div className="bg-gray-800 p-4 text-center flex items-center justify-center">
                        <span className="text-2xl">
                          {tradeInRequiredPieceIds.length} x
                        </span>

                        <div className="filter blur-sm">
                          {/* hardcoded values cuz this has a blur over it so doesnt matter */}
                          <ImageCard
                            key={"abc"}
                            src={pieces[0].token_metadata.image_url}
                            title={"abc"}
                            subtitle={`Token ID: ${pieces[0]}`}
                            showDivider={true}
                            height={100}
                            width={100}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="my-6">
                    <h3 className="my-1">You get</h3>
                    <div className="bg-gray-800 p-4 text-center flex items-center justify-center">
                      <span className="text-2xl pr-8">
                        {Math.floor(
                          pieces.length /
                            config.packs[tradeInChosenPack].tradeInPrice
                        )}{" "}
                        x
                      </span>
                      <img
                        src={config.packs[tradeInChosenPack].image}
                        height="100"
                        width="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </GradientModal>
          )}
        </>
      )}
    </>
  );
};
