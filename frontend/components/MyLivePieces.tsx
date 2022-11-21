import { isAddress } from "@ethersproject/address";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { PIECES_PER_PAGE } from "constants/constants";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import usePersonalSign from "hooks/usePersonalSign";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { MetaTransactionResponse } from "models/types/MetaTransactionResponse";
import { Piece } from "models/types/Piece";
import { useEffect, useState } from "react";
import { sliceArrayIntoChunks } from "utils/sliceArrayInChunks";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";
import { Button } from "./Button";
import { EmptyAndErrorState } from "./EmptyAndErrorState";
import { FailureModal } from "./FailureModal";
import { ImageCard } from "./ImageCard";
import { LoadingIndicator } from "./LoadingIndicator";
import { Modal } from "./Modal";
import { PageSectionTitle } from "./PageSectionTitle";
import { Pagination } from "./Pagination";
import { SuccessModal } from "./SuccessModal";

interface Props {
  config: IGameConfig;
}

export const MyLivePieces: React.FC<Props> = ({ config }) => {
  const { account, library } = useWeb3React();
  const personalSign = usePersonalSign();

  const [piecesPageNum, setPiecesPageNum] = useState(1);
  const [pieces, setPieces] = useState<Piece[]>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Transfer Pieces
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txnHash, setTxnHash] = useState("");
  const [transferPiece, setTransferPiece] = useState<Piece>();
  const [toAddress, setToAddress] = useState("");

  const isConnected = typeof account === "string" && !!library;

  const fetchLivePieces = async () => {
    try {
      const { data: livePieces } = await axios.get<Piece[]>(
        `/api/${account}/livepieces`
      );
      const filteredPieces = livePieces.filter(
        (p) => p.puzzle_group_id === config.dropConfig.activePuzzleGroup
      );
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

  const handleTransferPiece = async () => {
    try {
      setTransferInProgress(true);

      if (!isAddress(toAddress)) {
        throw new Error(`To address is not a valid ethereum address`);
      }

      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Make metatxn
      const response = await axios.post<MetaTransactionResponse>(
        "/api/metatxns",
        {
          game: config.path,
          action: EMetatransactionActionType.TRANSFER_PIECE,
          params: {
            to: toAddress,
            tokenId: transferPiece.token_id.split("-").pop(),
          },
          ethAddress: account,
          signature: sessionStorage.getItem(`${account}-signature`),
        }
      );

      setTxnHash(response.data.txnHash);
      await waitForTransactionByHash(library, response.data.txnHash);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setTransferInProgress(false);
    }
  };

  useEffect(() => {
    account && fetchLivePieces();
  }, [account]);

  return (
    <>
      <div id="live-pieces">
        <PageSectionTitle>My Pieces</PageSectionTitle>
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
              alt="No live pieces available"
              message="No live pieces available"
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
                    <div
                      className="flex flex-col"
                      key={piece.token_id.split("-").pop()}
                    >
                      <ImageCard
                        src={piece.token_metadata.image_url}
                        title={piece.puzzle_name}
                        subtitle={`Token ID: ${piece.token_id
                          .split("-")
                          .pop()}`}
                        showDivider={true}
                        height={300}
                        width={300}
                      />

                      <Button
                        type="border-gradient"
                        size="base"
                        className="mt-2"
                        onClick={() => {
                          setTransferPiece(piece);
                          setShowTransferModal(true);
                        }}
                      >
                        Transfer
                      </Button>
                    </div>
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
      <Modal
        isOpen={showTransferModal}
        loading={transferInProgress}
        onClose={() => setShowTransferModal(false)}
        txnHash={txnHash}
      >
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h2 className="text-center font-semibold text-2xl mt-2">
            Transfer Piece
          </h2>
          <div className="mt-8 flex-col justify-center">
            {transferPiece && (
              <ImageCard
                src={transferPiece.token_metadata.image_url}
                title={transferPiece.puzzle_name}
                subtitle={`Token ID: ${transferPiece.token_id
                  .split("-")
                  .pop()}`}
                height={200}
                width={200}
              />
            )}
            <div>
              <input
                className="my-3 w-96 rounded-lg bg-npt-lighter-dark p-3"
                type="text"
                placeholder="To: 0xABCD..."
                onChange={(event) => setToAddress(event.target.value)}
              />
            </div>
            <Button type="border-gradient" onClick={handleTransferPiece}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      <SuccessModal
        header="Transfer Successful"
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        You've successfully transfered your piece!
      </SuccessModal>
      <FailureModal
        header="Network Error"
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        {errorMessage}
      </FailureModal>
    </>
  );
};
