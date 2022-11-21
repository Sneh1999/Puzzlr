import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { Button } from "components/Button";
import { Dropdown, Menu, MenuItem } from "components/Dropdown";
import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { GradientTitle } from "components/GradientTitle";
import { ImageCard } from "components/ImageCard";
import { LoadingIndicator } from "components/LoadingIndicator";
import { Modal } from "components/Modal";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import usePersonalSign from "hooks/usePersonalSign";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { PackEntity } from "models/types/PackEntity";
import type { Puzzle } from "models/types/Puzzle";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { shortenHex } from "utils/eth";
import { sleep } from "utils/sleep";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";
import { FailureModal } from "./FailureModal";

const UNBOX_IMAGES_LOADING_WAIT = 10 * 1000; // 10 seconds

interface Props {
  config: IGameConfig;
}

export const YourPacks: React.FC<Props> = ({ config }) => {
  // Hooks
  const { account, library } = useWeb3React<Web3Provider>();
  const personalSign = usePersonalSign();
  const router = useRouter();

  // State variables
  const [packs, setPacks] = useState<PackEntity[]>();
  const [unboxedPieces, setUnboxedPieces] = useState<string[]>([]);
  const [showUnboxedPieces, setShowUnboxedPieces] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [loadingUnboxedPieces, setLoadingUnboxedPieces] = useState(false);
  const [unboxTxnHash, setUnboxTxnHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [packLoadingIntervalRef, setPackLoadingIntervalRef] =
    useState<NodeJS.Timeout>();
  const [menu, setMenu] = useState<React.ReactElement>();
  const [loadingStateMessage, setLoadingStateMessage] = useState("");

  const isConnected = typeof account === "string" && !!library;

  async function fetchUserPacks() {
    try {
      const response = await axios.get(`/api/${account}/packs`);
      const filteredPacks = (response.data as PackEntity[]).filter(
        (p) => Number(p.puzzleGroupId) === config.dropConfig.activePuzzleGroup
      );
      setPacks(filteredPacks);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoadingPacks(false);
    }
  }

  async function fetchLivePuzzles(): Promise<Puzzle[]> {
    try {
      const response = await axios.get<Puzzle[]>("/api/puzzles/live");
      return (response.data as Puzzle[]).filter(
        (p) => p.group_id === config.dropConfig.activePuzzleGroup
      );
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (account) {
      if (packLoadingIntervalRef) {
        clearInterval(packLoadingIntervalRef);
      }
      fetchUserPacks();

      const intervalId = setInterval(() => {
        fetchUserPacks();
      }, 5 * 1000);
      setPackLoadingIntervalRef(intervalId);
    }
  }, [account, showUnboxedPieces]);

  useEffect(() => {
    fetchLivePuzzles().then((puzzles) => {
      if (puzzles && puzzles.length > 0) {
        setMenu(
          <Menu>
            {puzzles.map((puzzle, i) => (
              <MenuItem
                key={i}
                onClick={() =>
                  router.push(
                    `/[game]/puzzles/[id]`,
                    `/${config.path}/puzzles/${puzzle.id}`
                  )
                }
              >
                <a>{puzzle.name}</a>
              </MenuItem>
            ))}
          </Menu>
        );
      }
    });
  }, []);

  const handleOpenPack = async (pack: PackEntity) => {
    try {
      setShowUnboxedPieces(true);
      setLoadingUnboxedPieces(true);
      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      setLoadingStateMessage("(1/3) Sending transaction...");

      // Open Pack metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.UNBOX_PACK,
        params: {
          puzzleGroupId: pack.puzzleGroupId,
          requestId: pack.requestId,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });
      setLoadingStateMessage("(2/3) Transaction sent! Waiting to be mined...");
      setUnboxTxnHash(response.data.txnHash);
      const txnReceipt = await waitForTransactionByHash(
        library,
        response.data.txnHash
      );

      const tokenIds: string[] = [];
      for (let i = 1; i < txnReceipt.logs.length; i += 3) {
        const tokenIdHex = txnReceipt.logs[i].topics[3];
        if (!tokenIdHex) continue;
        tokenIds.push(BigNumber.from(tokenIdHex).toString());
        if (
          tokenIds.length >=
          config.packs.find((p) => p.tier === pack.tier).numPieces
        ) {
          break;
        }
      }

      console.log(tokenIds);

      setLoadingStateMessage("(3/3) Loading your pieces... Estimated ~15s");

      await sleep(UNBOX_IMAGES_LOADING_WAIT);

      const imagesResponse = await axios.post(
        "/api/pieces/getImagesForTokenIds",
        {
          game: config.path,
          tokenIds,
        }
      );
      setUnboxedPieces(imagesResponse.data.images);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
      setShowUnboxedPieces(false);
    } finally {
      setLoadingUnboxedPieces(false);
      setUnboxTxnHash("");
      setLoadingStateMessage("");
    }
  };

  return (
    <div className="pb-20">
      <div className="w-full max-w-screen-2xl mx-auto">
        <GradientTitle className="pt-4" center size="large">
          Your Packs
        </GradientTitle>
        {!isConnected ? (
          <div className="my-16 mx-auto">
            <EmptyAndErrorState
              image="/wallet.png"
              alt="Sign in"
              message="Please sign in to view your packs"
            />
          </div>
        ) : loadingPacks ? (
          <div className="pt-12">
            <LoadingIndicator />
          </div>
        ) : packs && packs.length > 0 ? (
          <div className="flex flex-wrap px-8 my-12 justify-center">
            {packs.map((pack) => (
              <div
                className="border border-gray-600 p-8 rounded-2xl w-64 mr-5 mb-5"
                key={pack.requestId}
              >
                <ImageCard
                  showDivider={false}
                  src={config.packs.find((p) => p.tier === pack.tier).image}
                  width={128}
                  height={120}
                >
                  <Button
                    className="mx-auto mt-6"
                    type="border-gradient"
                    onClick={() => handleOpenPack(pack)}
                  >
                    Open Pack
                  </Button>
                  <p className="w-full text-center pt-2 text-gray-400 text-sm">
                    ID: {shortenHex(pack.requestId)}
                  </p>
                </ImageCard>
              </div>
            ))}
          </div>
        ) : (
          <div className="my-16 mx-auto">
            <EmptyAndErrorState
              image="/hand.png"
              alt="You have no packs"
              message="You either don't own packs or they are currently being generated"
            />
          </div>
        )}
        <Modal
          isOpen={showUnboxedPieces}
          loading={loadingUnboxedPieces}
          loadingStateMessage={loadingStateMessage}
          txnHash={unboxTxnHash}
          onClose={() => setShowUnboxedPieces(false)}
        >
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h2 className="text-center font-semibold text-2xl mt-2">
              🔥 Unboxing Successful
            </h2>
            <p className="text-center font-light pt-4">
              You've received the following pieces from your pack!
            </p>
            <p className="text-center text-sm text-gray-400 pt-2">
              Select an active puzzle to get started.
            </p>
            <div className="py-4">
              <Dropdown menu={menu}>Active Puzzles</Dropdown>
            </div>
            <div className="flex flex-wrap pt-8 justify-center">
              {unboxedPieces.map((piece, idx) => (
                <div
                  className="rounded-lg overflow-hidden mr-4 mb-4 w-20 transition duration-100 ease-linear transform hover:scale-225 hover:z-50"
                  key={idx}
                >
                  <img
                    className="w-full object-cover"
                    src={piece}
                    alt="a puzzle piece"
                    width={80}
                    height={80}
                  />
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <FailureModal
          header="Unboxing Unsuccessful"
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
        >
          {errorMessage}
        </FailureModal>
      </div>
    </div>
  );
};
