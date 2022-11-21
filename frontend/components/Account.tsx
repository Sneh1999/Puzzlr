import MetaMaskOnboarding from "@metamask/onboarding";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import {
  InjectedConnector,
  UserRejectedRequestError,
} from "@web3-react/injected-connector";
import { TorusConnector } from "@web3-react/torus-connector";
import { injected, torusConnector } from "connectors";
import { AURORA_NETWORK_PARAMS } from "constants/eth";
import useENSName from "hooks/useENSName";
import useGameConfig from "hooks/useGameConfig";
import React, { useEffect, useState } from "react";
import { formatEtherscanLink, shortenHex } from "utils/eth";
import { GradientButton } from "./GradientButton";
import { Modal } from "./Modal";

type Props = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: Props) => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);
  const { error, activate, chainId, account, setError } = useWeb3React();
  console.log(chainId);
  const [isFactionChosen, setIsFactionChosen] = useState<boolean>();

  const ENSName = useENSName(account);
  const config = useGameConfig();

  useEffect(() => {
    if (sessionStorage.getItem("usingTorus") && typeof account !== "string") {
      activate(torusConnector).catch((error) => {
        if (error instanceof UserRejectedRequestError) {
        } else if (error instanceof UnsupportedChainIdError) {
          setShowNetworkSwitch(true);
          setError(error);
        } else {
          setError(error);
        }
        setShowErrorModal(true);
      });
    }
  }, []);

  useEffect(() => {
    console.log(chainId);
    if (error instanceof UnsupportedChainIdError) {
      setShowNetworkSwitch(true);
      setShowErrorModal(true);
    }
  }, [chainId, account, error, triedToEagerConnect, config]);

  function signIn(connector: InjectedConnector | TorusConnector) {
    activate(connector, undefined, true)
      .then(() => {
        if (connector instanceof TorusConnector) {
          sessionStorage.setItem("usingTorus", "true");
        }
      })
      .catch((error) => {
        if (error instanceof UserRejectedRequestError) {
        } else if (error instanceof UnsupportedChainIdError) {
          setShowNetworkSwitch(true);
          setError(error);
        } else {
          setError(error);
        }
        setShowErrorModal(true);
      });
  }

  function switchNetwork() {
    injected.getProvider().then((provider) => {
      provider
        .request({
          method: "wallet_addEthereumChain",
          params: [AURORA_NETWORK_PARAMS],
        })
        .then(() => {
          signIn(injected);
        })
        .catch((error: any) => {
          setError(error);
          setShowErrorModal(true);
        });
    });
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    const hasMetaMaskOrWeb3Available =
      MetaMaskOnboarding.isMetaMaskInstalled() ||
      (window as any)?.ethereum ||
      (window as any)?.web3;

    return (
      <div>
        {hasMetaMaskOrWeb3Available ? (
          <button
            className="border-2 border-gray-400 rounded-2xl px-4 py-2"
            onClick={() => signIn(injected)}
          >
            {MetaMaskOnboarding.isMetaMaskInstalled()
              ? "Connect to MetaMask"
              : "Connect to Wallet"}
          </button>
        ) : (
          <div className="border-2 border-gray-400 rounded-2xl px-4 py-2">
            <button onClick={() => signIn(torusConnector)}>Sign In</button>
          </div>
        )}
        <Modal
          isOpen={showErrorModal}
          onClose={() => {
            setShowErrorModal(false);
            setShowNetworkSwitch(false);
          }}
        >
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h2 className="text-center font-semibold text-2xl mt-2">
              😥 Sign In Unsuccessful
            </h2>
            <div className="mt-4 flex justify-center">
              <img src="/failure.png" />
            </div>
            <p className="pt-4 text-base text-center font-light">
              You're on an unsupported network. Please switch to{" "}
              <b>{"Aurora Testnet "}</b>
              to sign in.
            </p>
          </div>
          {showNetworkSwitch ? (
            <div className="my-4">
              <GradientButton onClick={switchNetwork}>
                Switch Network
              </GradientButton>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }

  return (
    <a
      {...{
        href: formatEtherscanLink("Account", [chainId, account]),
        target: "_blank",
        rel: "noopener noreferrer",
      }}
    >
      {ENSName || `${shortenHex(account, 4)}`}
    </a>
  );
};

export default Account;
