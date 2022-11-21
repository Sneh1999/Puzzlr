import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { CreditCardIcon } from "@heroicons/react/solid";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { Button } from "components/Button";
import { GradientTitle } from "components/GradientTitle";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import useERC20Contract from "hooks/useERC20Contract";
import usePersonalSign from "hooks/usePersonalSign";
import { usePuzzleManagerContract } from "hooks/usePuzzleManagerContract";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { EPackTiers } from "models/enums/EPackTiers";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { getStripe } from "utils/getStripe";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";
import { EmptyAndErrorState } from "./EmptyAndErrorState";
import { FailureModal } from "./FailureModal";
import { Modal } from "./Modal";
import { OpenCollectTrade } from "./OpenCollectTrade";
import { PackPurchase } from "./PackPurchase";
import { SuccessModal } from "./SuccessModal";

interface Props {
  config: IGameConfig;
}

export const BuyPacks = ({ config }: Props) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const daiTokenContract = useERC20Contract(
    process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS,
    true
  );
  let puzzleManagerContract = usePuzzleManagerContract(config, true);
  const [buyPackLoading, setBuyPackLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openBuyPackModal, setOpenBuyPackModal] = useState(false);
  const [buyPackWithDaiLoading, setBuyPackWithDaiLoading] = useState(false);
  const [buyPackWithCardLoading, setBuyPackWithCardLoading] = useState(false);
  const [acceptDai, setAcceptDai] = useState(false);
  const [acceptDaiLoading, setAcceptDaiLoading] = useState(false);
  const [acceptCardLoading, setAcceptCardLoading] = useState(false);
  const [packTier, setPackTier] = useState<EPackTiers>();
  const [price, setPrice] = useState(0);
  const [daiAllowanceForUser, setDaiAllowanceForUser] = useState<BigNumber>();
  const router = useRouter();
  const personalSign = usePersonalSign();

  const isConnected = typeof account === "string" && !!library;
  const networkName = chainId === 80001 ? "mumbai" : "matic";

  // In case of redirect from Stripe payment
  useEffect(() => {
    if (router.query["success"]) {
      router.replace(`/${config.path}/packs`, undefined, { shallow: true });
      setShowSuccessModal(true);
    }
    if (router.query["canceled"]) {
      router.replace(`/${config.path}/packs`, undefined, { shallow: true });
      setShowErrorModal(true);
      setErrorMessage("Payment cancelled");
    }
  }, [router]);

  // Puzzle must be active before being able to purchase
  async function checkForActivePuzzles() {
    try {
      const response = await axios.get("/api/subgraph/createdPuzzles");
      if (response.data.length === 0) {
        throw new Error("There are currently no active puzzles for this game");
      }
    } catch (error) {
      throw error;
    }
  }

  // Handle click on buy pack for any given pack
  const handleBuyPackInitiate = async (packTier: EPackTiers) => {
    try {
      await checkForActivePuzzles();

      let tempPrice = config.packs.find((x) => x.tier === packTier).price;
      if (tempPrice !== 0) {
        const tempDaiAllowanceForUser: BigNumber =
          (await daiTokenContract.allowance(
            account,
            config.networkConfig[networkName].managerAddress
          )) as BigNumber;

        setDaiAllowanceForUser(tempDaiAllowanceForUser);
        setPrice(tempPrice);
        setPackTier(packTier);
        setBuyPackLoading(true);
        setOpenBuyPackModal(true);
      } else {
        setBuyPackLoading(true);
        await sendAndWaitForBuyPackMetatxn(
          config.dropConfig.activePuzzleGroup,
          packTier
        );
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    }
  };

  // Buy pack metatxn for free pack
  async function sendAndWaitForBuyPackMetatxn(
    puzzleGroupId: number,
    tier: number
  ) {
    try {
      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Buy Pack metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.BUY_PACK,
        params: {
          puzzleGroupId: puzzleGroupId,
          tier: tier,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });

      await waitForTransactionByHash(library, response.data.txnHash);
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
      setBuyPackLoading(false);
    }
  }

  // handle click on DAI payment option
  const handleBuyPackWithDAI = async () => {
    try {
      const priceInWei = parseEther(price.toString());
      if (!acceptDai && daiAllowanceForUser.lt(BigNumber.from(priceInWei))) {
        const approveDaiTxn = await daiTokenContract.approve(
          config.networkConfig[networkName].managerAddress,
          priceInWei
        );
        await approveDaiTxn.wait();

        setAcceptDai(true);
      } else {
        if (buyPackLoading) {
          const buyPackTxn = await puzzleManagerContract.buyPackForTier(
            config.dropConfig.activePuzzleGroup,
            account,
            packTier
          );
          await buyPackTxn.wait();
        }
        setShowSuccessModal(true);
        setOpenBuyPackModal(false);
        setBuyPackLoading(false);
      }
    } catch (error) {
      console.error(error);
      if (error.data) {
        setErrorMessage(error.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
      handleClose();
    } finally {
      setAcceptDaiLoading(false);
    }
  };

  const handleBuyPackWithCard = async () => {
    try {
      const stripePromise = await getStripe();
      const bodyParameters = {
        packPrice: price,
        packTier: packTier,
        address: account,
        puzzleGroupId: config.dropConfig.activePuzzleGroup,
      };
      const session = await axios.post(`/api/payment/`, bodyParameters);
      const { error } = await stripePromise!.redirectToCheckout({
        sessionId: session.data.id,
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      handleClose();
      setAcceptCardLoading(false);
    }
  };

  const handleClose = () => {
    setOpenBuyPackModal(false);
    setBuyPackLoading(false);
    setBuyPackWithCardLoading(false);
    setBuyPackWithDaiLoading(false);
    setAcceptDai(false);
    setOpenBuyPackModal(false);
  };

  return (
    <div>
      <div className="mt-20 mb-10">
        <div className="flex justify-center">
          <OpenCollectTrade />
        </div>
        <GradientTitle className="pt-4" center size="large">
          Packs
        </GradientTitle>
        {/* <div className="text-center pt-2 text-indigo-400">
          Collect Gold, Silver and Bronze Pack(s)
        </div> */}
        <br />

        {isConnected ? (
          <>
            <div className="text-center text-indigo-200">
              {/* We need to reverse the array to print this from highest to lowest. 
              We slice it because otherwise it modifies the array in-place and the rendering of pack images also gets reversed. 
              See https://stackoverflow.com/questions/30610523/reverse-array-in-javascript-without-mutating-original-array */}
              {config.packs
                .slice()
                .reverse()
                .map((pack) => (
                  <>
                    {pack.name} &#8594; {pack.numPieces} pieces <br />
                  </>
                ))}
            </div>
            <div className="flex justify-center space-x-8">
              {config.packs.map((pack) => (
                <PackPurchase
                  key={pack.tier}
                  imgSrc={pack.image}
                  loading={buyPackLoading}
                  onClick={() => handleBuyPackInitiate(pack.tier)}
                >
                  Buy {pack.name} (${pack.price})
                </PackPurchase>
              ))}
            </div>
          </>
        ) : (
          <EmptyAndErrorState
            image="/wallet.png"
            alt="sign in"
            message="Please sign in to buy packs"
          />
        )}
        <div className="flex justify-center">
          <SuccessModal
            isOpen={showSuccessModal}
            header="Purchase Successful"
            onClose={() => {
              setShowSuccessModal(false);
              handleClose();
            }}
          >
            Our thingamajigs are working on assembling your pack.
            <br />
            It may take a few seconds to show up in "Your Packs".
          </SuccessModal>

          <FailureModal
            isOpen={showErrorModal}
            header="Purchase Unsuccessful"
            onClose={() => {
              setShowErrorModal(false);
              handleClose();
            }}
          >
            {errorMessage}
          </FailureModal>

          <Modal
            isOpen={openBuyPackModal}
            onClose={() => {
              handleClose();
            }}
          >
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {buyPackWithDaiLoading || buyPackWithCardLoading ? (
                buyPackWithDaiLoading ? (
                  <div>
                    <h2 className="text-center font-semibold text-2xl mt-2">
                      Polygon DAI Payment
                    </h2>
                    <h2 className="pt-4 text-sm text-center text-gray-400">
                      Accept transactions through your wallet to purchase
                      <br />
                      pack(s) using DAI on Polygon
                    </h2>
                    <h3 className="pt-4 text-sm text-center text-white-400">
                      <a
                        target="_blank"
                        href=" https://wallet.matic.network/bridge/"
                      >
                        <u>Bridge DAI from Ethereum Mainnet to Polygon</u>
                      </a>
                    </h3>
                    <div>
                      {!acceptDai &&
                      daiAllowanceForUser.lt(
                        BigNumber.from(parseEther(price.toString()))
                      ) ? (
                        <Button
                          className="mt-10 px-10"
                          loading={acceptDaiLoading}
                          onClick={() => {
                            setAcceptDaiLoading(true);
                            handleBuyPackWithDAI();
                          }}
                        >
                          Approve DAI
                        </Button>
                      ) : (
                        <Button
                          className="mt-10 px-10"
                          loading={acceptDaiLoading}
                          onClick={() => {
                            setAcceptDaiLoading(true);
                            handleBuyPackWithDAI();
                          }}
                        >
                          <div>Buy Pack (${price})</div>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-center font-semibold text-2xl mt-2">
                      Credit Card Payment
                    </h2>
                    <h2 className="pt-4 text-sm text-center text-gray-400">
                      Complete the Stripe transaction to buy pack(s) using a
                      credit card
                    </h2>
                    <Button
                      className="mt-10 px-10"
                      loading={acceptCardLoading}
                      onClick={() => {
                        setAcceptCardLoading(true);
                        handleBuyPackWithCard();
                      }}
                    >
                      <CreditCardIcon className="h-5 mr-6 w-5 right-0" />
                      <div>Pay With Credit Card (${price})</div>
                    </Button>
                  </div>
                )
              ) : (
                //TODO: add this div to a component
                <div>
                  <h2 className="text-center font-semibold text-2xl mt-2">
                    Choose a Payment Method
                  </h2>
                  <h2 className="pt-4 text-sm text-center text-gray-400">
                    Pay using your prefered payment method to buy pack(s)
                  </h2>
                  <Button
                    type="border-gradient"
                    className="mt-10 px-20"
                    onClick={() => setBuyPackWithCardLoading(true)}
                  >
                    <CreditCardIcon className="h-5 mr-6 w-5 right-0" />
                    Credit Card
                  </Button>
                  <Button
                    type="border-gradient"
                    className="m-4 px-20"
                    onClick={() => setBuyPackWithDaiLoading(true)}
                    loading={buyPackWithDaiLoading}
                  >
                    <img className="h-5 mr-6 w-5 right-0" src="/dai.svg" />
                    DAI on Polygon
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};
