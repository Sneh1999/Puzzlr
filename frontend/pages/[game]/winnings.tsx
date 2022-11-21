import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { Button } from "components/Button";
import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { FailureModal } from "components/FailureModal";
import { LoadingIndicator } from "components/LoadingIndicator";
import { MainContainer } from "components/MainContainer";
import { Modal } from "components/Modal";
import { PageSectionTitle } from "components/PageSectionTitle";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import useGameConfig from "hooks/useGameConfig";
import usePersonalSign from "hooks/usePersonalSign";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { Winning } from "models/types/Winning";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";

export default function Winnings() {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const personalSign = usePersonalSign();
  const router = useRouter();

  const [loadingWinnings, setLoadingWinnings] = useState(true);
  const [showClaimedPrizeSuccessModal, setShowClaimedPrizeSuccessModal] =
    useState(false);
  const [loadingClaimedPrizeSuccess, setLoadingClaimedPrizeSuccess] =
    useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unclaimedWinnings, setUnclaimedWinnings] = useState<Winning[]>();
  const [claimedWinnings, setClaimedWinnings] = useState<Winning[]>();
  const [fireConfetti, setFireConfetti] = useState(false);
  const [txnHash, setTxnHash] = useState("");

  const isConnected = typeof account === "string" && !!library;
  const config = useGameConfig();

  async function fetchWinnings() {
    try {
      const response = await axios.get<Winning[]>(`/api/${account}/winnings`);
      const winnings = response.data.filter(
        (w) => w.puzzleGroupId === config.dropConfig.activePuzzleGroup
      );
      const tempClaimedWinnings = winnings.filter((w: Winning) => w.claimed);
      const tempUnclaimedWinnings = winnings.filter((w: Winning) => !w.claimed);
      setClaimedWinnings(tempClaimedWinnings);
      setUnclaimedWinnings(tempUnclaimedWinnings);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoadingWinnings(false);
    }
  }

  useEffect(() => {
    if (account && config) {
      fetchWinnings();
    }
  }, [account, config]);

  const handleClaimPrize = async (winning: Winning) => {
    try {
      setShowClaimedPrizeSuccessModal(true);
      setLoadingClaimedPrizeSuccess(true);

      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Claim Prize metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.CLAIM_PRIZE,
        params: {
          puzzleId: winning.puzzleId,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });

      setTxnHash(response.data.txnHash);
      // Wait for mining
      await waitForTransactionByHash(library, response.data.txnHash);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
      setShowClaimedPrizeSuccessModal(false);
    } finally {
      setLoadingClaimedPrizeSuccess(false);
      setFireConfetti(true);
      fetchWinnings();
      setTxnHash("");
    }
  };

  if (!config) {
    return null;
  }

  if (!isConnected) {
    return (
      <MainContainer game={config}>
        <div className="my-16 flex justify-center">
          <EmptyAndErrorState
            image="/wallet.png"
            alt="Sign in"
            message="Please sign in to view your winnings"
          />
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer game={config}>
      <UnclaimedWinnings
        loadingWinnings={loadingWinnings}
        unclaimedWinnings={unclaimedWinnings}
        handleClaimPrize={handleClaimPrize}
      />
      <ClaimedWinnings
        loadingWinnings={loadingWinnings}
        claimedWinnings={claimedWinnings}
      />
      <Modal
        isOpen={showClaimedPrizeSuccessModal}
        loading={loadingClaimedPrizeSuccess}
        txnHash={txnHash}
        onClose={() => {
          setShowClaimedPrizeSuccessModal(false);
          router.reload();
        }}
      >
        <ReactCanvasConfetti
          className="w-full -z-10 fixed"
          fire={fireConfetti}
          onDecay={() => setFireConfetti(false)}
          gravity={0.5}
          startVelocity={25}
          ticks={1000}
          spread={180}
        />
        <div className="px-4 pt-5 pb-4 h-80 sm:p-6 sm:pb-4">
          <h2 className="text-center font-semibold text-2xl mt-2">
            🔥 Claim Successful
          </h2>
          <div className="mt-16 flex justify-center">
            <img src="/success.png" />
          </div>
          <p className="text-center pt-8">
            You've successfully claimed your prize
          </p>
        </div>
      </Modal>
      <FailureModal
        header="Network Error"
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        {errorMessage}
      </FailureModal>
    </MainContainer>
  );
}

interface UnclaimedWinningsProps {
  loadingWinnings: boolean;
  unclaimedWinnings: Winning[];
  handleClaimPrize: (winning: Winning) => Promise<void>;
}

function UnclaimedWinnings({
  loadingWinnings,
  unclaimedWinnings,
  handleClaimPrize,
}: UnclaimedWinningsProps) {
  return (
    <>
      <PageSectionTitle>Unclaimed</PageSectionTitle>
      {loadingWinnings ? (
        <div className="py-32">
          <LoadingIndicator />
        </div>
      ) : !unclaimedWinnings || unclaimedWinnings.length === 0 ? (
        <div className="my-16 flex justify-center">
          <EmptyAndErrorState
            image="/hand.png"
            alt="No unclaimed winnings"
            message="No unclaimed winnings"
          />
        </div>
      ) : (
        <div className="flex flex-wrap space-x-12 my-8">
          {unclaimedWinnings.map((winning, idx) => (
            <div className="w-80" key={idx}>
              <div className="overflow-hidden rounded-xl">
                <img
                  className="object-cover object-center w-full h-64"
                  src={winning.prize_image_url}
                />
              </div>
              <div className="">
                <h4 className="text-base mt-3 mb-2 font-semibold">
                  {winning.name}
                </h4>
                {winning.description ? (
                  <>
                    <div className="pt-1 border-b border-gray-700" />
                    <h6 className="pt-2 text-sm">{winning.description}</h6>
                  </>
                ) : null}
                <div className="my-4 flex justify-center space-x-3">
                  <Button
                    className="px-12"
                    type="border-gradient"
                    size="large"
                    onClick={() => handleClaimPrize(winning)}
                  >
                    Claim
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

interface ClaimedWinningsProps {
  loadingWinnings: boolean;
  claimedWinnings: Winning[];
  openseaBaseURL: string;
}

function ClaimedWinnings({
  loadingWinnings,
  claimedWinnings,
}: ClaimedWinningsProps) {
  return (
    <>
      <PageSectionTitle>Claimed</PageSectionTitle>
      {loadingWinnings ? (
        <div className="py-32">
          <LoadingIndicator />
        </div>
      ) : !claimedWinnings || claimedWinnings.length === 0 ? (
        <div className="my-16 flex justify-center">
          <EmptyAndErrorState
            image="/hand.png"
            alt="No claimed winnings"
            message="No claimed winnings"
          />
        </div>
      ) : (
        <div className="flex flex-wrap space-x-12 my-8">
          {claimedWinnings.map((winning, idx) => (
            <div className="w-80" key={idx}>
              <div className="overflow-hidden rounded-xl">
                <img
                  className="object-cover object-center w-full h-64"
                  src={winning.prize_image_url}
                />
              </div>
              <div className="">
                <h4 className="text-base mt-3 mb-2 font-semibold">
                  {winning.name}
                </h4>
                {winning.description ? (
                  <>
                    <div className="pt-1 border-b border-gray-700" />
                    <h6 className="pt-2 text-sm">{winning.description}</h6>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
