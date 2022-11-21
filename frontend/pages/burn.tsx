import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { GradientButton } from "components/GradientButton";
import { LoadingIndicator } from "components/LoadingIndicator";
import { Modal } from "components/Modal";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import usePersonalSign from "hooks/usePersonalSign";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Burn() {
  const { account, library } = useWeb3React();
  const isConnected = typeof account === "string" && !!library;
  const personalSign = usePersonalSign();

  const [myPieces, setMyPieces] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingApiResponse, setLoadingApiResponse] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [burnRequested, setBurnRequested] = useState(false);

  const router = useRouter();

  async function fetchBurnRequest() {
    try {
      setLoading(true);
      const response = await axios.get(`/api/burn/check?ethAddress=${account}`);

      if (response.data.requestedBurn) {
        setBurnRequested(true);
      }
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
  }

  async function fetchMyExpiredPieces() {
    try {
      setLoading(true);
      const { data: expiredPieces } = await axios.get(
        `/api/${account}/expiredpieces`
      );
      setMyPieces(expiredPieces);
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
  }

  useEffect(() => {
    if (isConnected) {
      fetchBurnRequest().then(fetchMyExpiredPieces);
    }
  }, [account]);

  async function requestBurn() {
    setLoadingApiResponse(true);
    setShowBurnModal(true);
    try {
      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Burn request
      await axios.post("/api/burn/request", {
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
      setShowBurnModal(false);
    } finally {
      setLoadingApiResponse(false);
    }
  }

  return (
    <div className="flex justify-center items-center h-96">
      {!isConnected ? (
        <EmptyAndErrorState
          image="/wallet.png"
          message="You need to be signed in to burn your pieces"
          alt="not signed in"
        />
      ) : loading ? (
        <div className="py-32">
          <LoadingIndicator />
        </div>
      ) : burnRequested ? (
        <div className="flex flex-col items-center">
          <span className="my-4">
            You have already requested a burn! Your pieces are scheduled to be
            burned within 24 hours!
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <span className="my-4">
            You own {myPieces.length} expired pieces{" "}
          </span>
          <GradientButton
            disabled={myPieces.length <= 0}
            onClick={() => {
              if (myPieces.length > 0) {
                requestBurn();
              }
            }}
          >
            Burn all my pieces
          </GradientButton>
        </div>
      )}

      <Modal
        isOpen={showBurnModal}
        onClose={() => {
          setShowBurnModal(false);
          router.reload();
        }}
        loading={loadingApiResponse}
      >
        <div className="px-4 pt-5 pb-4 h-80 sm:p-6 sm:pb-4">
          <h2 className="text-center font-semibold text-2xl mt-2">
            🔥 Burn Request Successful
          </h2>
          <p className="pt-8 text-base text-center font-light">
            Your burn request was successfully queued! Your pieces are scheduled
            to be burned within 24 hours
          </p>
        </div>
      </Modal>

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}>
        <div className="px-4 pt-5 pb-4 h-80 sm:p-6 sm:pb-4">
          <h2 className="text-center font-semibold text-2xl mt-2">
            😥 Something went wrong
          </h2>
          <p className="pt-8 text-base text-center font-light">
            {errorMessage}
          </p>
        </div>
      </Modal>
    </div>
  );
}
