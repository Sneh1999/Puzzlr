import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { AddListing } from "components/AddListing";
import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { FailureModal } from "components/FailureModal";
import { GradientButton } from "components/GradientButton";
import { GroupedButton } from "components/GroupedButton";
import { Listings } from "components/Listings";
import { LoadingIndicator } from "components/LoadingIndicator";
import { MainContainer } from "components/MainContainer";
import { Modal } from "components/Modal";
import { PageSectionTitle } from "components/PageSectionTitle";
import { SuccessModal } from "components/SuccessModal";
import { INITIAL_MIN_TIMESTAMP } from "constants/constants";
import { LOGIN_SIGNING_MESSAGE } from "constants/eth";
import useGameConfig from "hooks/useGameConfig";
import usePersonalSign from "hooks/usePersonalSign";
import { EMetatransactionActionType } from "models/enums/EMetatransactionActionType";
import { ListingEntity } from "models/types/ListingEntity";
import { DeleteListingsParams } from "models/types/MetatransactionRequest";
import { Piece } from "models/types/Piece";
import { Puzzle } from "models/types/Puzzle";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { shuffle } from "utils/shuffle";
import { waitForTransactionByHash } from "utils/waitForTransactionByHash";

const ITEMS_PER_PAGE = 10;

export type MarketplaceView = "all-listings" | "my-listings" | "swap-history";

export default function Marketplace() {
  const [view, setView] = useState<MarketplaceView>("all-listings");
  const [myPieces, setMyPieces] = useState<Piece[]>();
  const [myPiecesByPuzzleName, setMyPiecesByPuzzleName] =
    useState<{ [key: string]: Piece[] }>();
  const [myListings, setMyListings] = useState<ListingEntity[]>([]);
  const [mySoldListings, setMySoldListings] = useState<ListingEntity[]>([]);
  const [myBoughtListings, setMyBoughtListings] = useState<ListingEntity[]>([]);
  const [loadingSwapHistory, setLoadingSwapHistory] = useState(false);
  const [loadingSwapSuccess, setLoadingSwapSuccess] = useState(false);
  const [loadingDeleteSuccess, setLoadingDeleteSuccess] = useState(false);
  const [loadingAddListingSuccess, setLoadingAddListingSuccess] =
    useState(false);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [showSwapSuccessModal, setShowSwapSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showAddListingSuccessModal, setShowAddListingSuccessModal] =
    useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loadMoreListings, setLoadMoreListings] = useState(true);
  const [loadMoreMyListings, setLoadMoreMyListings] = useState(true);
  const [loadMoreSwapHistorySold, setLoadMoreSwapHistorySold] = useState(true);
  const [loadMoreSwapHistoryBought, setLoadMoreSwapHistoryBought] =
    useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeListings, setActiveListings] = useState<ListingEntity[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedListingsForDelete, setSelectedListingsForDelete] = useState<{
    [key: string]: boolean;
  }>({});

  const [timestamp, setTimestamp] = useState(INITIAL_MIN_TIMESTAMP);
  const [myListingsTimestamp, setMyListingsTimestamp] = useState(
    INITIAL_MIN_TIMESTAMP
  );
  const [swapHistorySoldTimestamp, setSwapSoldHistoryTimestamp] = useState(
    INITIAL_MIN_TIMESTAMP
  );
  const [swapHistoryBoughtTimestamp, setSwapBoughtHistoryTimestamp] = useState(
    INITIAL_MIN_TIMESTAMP
  );
  const [allPiecesByPuzzleName, setAllPiecesByPuzzleName] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isLoading, setLoading] = useState(false);
  const [txnHash, setTxnHash] = useState("");

  const config = useGameConfig();

  const { account, library } = useWeb3React<Web3Provider>();
  const personalSign = usePersonalSign();
  const router = useRouter();

  const isView = (v: MarketplaceView) => view === v;
  const isConnected = typeof account === "string" && !!library;

  function filterActiveWantsPieces(l: ListingEntity) {
    let idx = l.wantsPiecesPuzzleGroupIds.findIndex(
      (_id) => _id !== config.dropConfig.activePuzzleGroup
    );

    while (idx >= 0) {
      l.wantsPiecesPuzzleNames.splice(idx, 1);
      l.wantsPiecesPuzzleGroupIds.splice(idx, 1);
      l.wantsPiecesImages.splice(idx, 1);
      l.wantsPieces.splice(idx, 1);

      idx = l.wantsPiecesPuzzleGroupIds.findIndex(
        (_id) => _id !== config.dropConfig.activePuzzleGroup
      );
    }

    if (
      l.wantsPiecesPuzzleGroupIds.length > 0 &&
      l.sellerTokenPuzzleGroupId === config.dropConfig.activePuzzleGroup
    ) {
      return true;
    }
    return false;
  }

  async function fetchLivePieces() {
    try {
      const { data: livePieces } = await axios.get<Piece[]>(
        `/api/${account}/livepieces`
      );
      const filteredLivePieces = livePieces.filter(
        (p) => p.puzzle_group_id === config.dropConfig.activePuzzleGroup
      );

      const tempMyPieces: Piece[] = [];
      const tempMyPiecesByPuzzleName: {
        [key: string]: Piece[];
      } = {};
      for (let piece of filteredLivePieces) {
        if (tempMyPiecesByPuzzleName[piece.puzzle_name]) {
          tempMyPiecesByPuzzleName[piece.puzzle_name].push(piece);
        } else {
          tempMyPiecesByPuzzleName[piece.puzzle_name] = [piece];
        }
        tempMyPieces.push(piece);
      }
      setMyPieces(tempMyPieces);
      setMyPiecesByPuzzleName(tempMyPiecesByPuzzleName);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    }
  }

  async function fetchSwapHistorySold() {
    try {
      let oldSwapHistorySold = [];
      oldSwapHistorySold.push(...mySoldListings);
      const swapHistorySoldResponse = await axios.get<{
        soldListings: ListingEntity[];
      }>(`/api/${account}/swapHistory`, {
        params: {
          timestamp: swapHistorySoldTimestamp,
          type: "SOLD",
        },
      });

      let tempSwapHistorySold: ListingEntity[] =
        swapHistorySoldResponse.data.soldListings.filter(
          (l) =>
            l.buyerPiecePuzzleGroupId === config.dropConfig.activePuzzleGroup &&
            l.sellerTokenPuzzleGroupId === config.dropConfig.activePuzzleGroup
        );
      if (tempSwapHistorySold && tempSwapHistorySold.length > 0) {
        setSwapSoldHistoryTimestamp(
          tempSwapHistorySold[tempSwapHistorySold.length - 1].timestamp
        );
        setLoadMoreSwapHistorySold(true);
      } else {
        setLoadMoreSwapHistorySold(false);
      }

      oldSwapHistorySold.push(...tempSwapHistorySold);
      setMySoldListings(oldSwapHistorySold);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    }
  }
  async function fetchSwapHistoryBought() {
    try {
      let oldSwapHistoryBought = [];
      oldSwapHistoryBought.push(...myBoughtListings);
      const swapHistoryBoughtResponse = await axios.get<{
        boughtListings: ListingEntity[];
      }>(`/api/${account}/swapHistory`, {
        params: {
          timestamp: swapHistoryBoughtTimestamp,
          type: "BOUGHT",
        },
      });

      let tempSwapHistoryBought: ListingEntity[] =
        swapHistoryBoughtResponse.data.boughtListings.filter(
          (l) =>
            l.buyerPiecePuzzleGroupId === config.dropConfig.activePuzzleGroup &&
            l.sellerTokenPuzzleGroupId === config.dropConfig.activePuzzleGroup
        );

      if (tempSwapHistoryBought && tempSwapHistoryBought.length > 0) {
        setSwapBoughtHistoryTimestamp(
          tempSwapHistoryBought[tempSwapHistoryBought.length - 1].timestamp
        );
        setLoadMoreSwapHistoryBought(true);
      } else {
        setLoadMoreSwapHistoryBought(false);
      }

      oldSwapHistoryBought.push(...tempSwapHistoryBought);

      setMyBoughtListings(oldSwapHistoryBought);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    } finally {
      setLoadingSwapHistory(false);
    }
  }

  async function fetchMyListings() {
    try {
      let oldMyListings = myListings;
      const myListingsResponse = await axios.get<ListingEntity[]>(
        `/api/${account}/mylistings`,
        {
          params: {
            timestamp: myListingsTimestamp,
          },
        }
      );

      const tempMyListings = myListingsResponse.data.filter((l) =>
        filterActiveWantsPieces(l)
      );

      if (tempMyListings && tempMyListings.length > 0) {
        setMyListingsTimestamp(
          tempMyListings[tempMyListings.length - 1].timestamp
        );
        setLoadMoreMyListings(true);
      } else {
        setLoadMoreMyListings(false);
      }

      oldMyListings.push(...tempMyListings);
      setMyListings(oldMyListings);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
    }
  }

  // NOTE: FIX THIS SHIT - whoever can read this in one go and understand it you have my utmost respect
  async function handleDeleteClick() {
    if (deleteMode) {
      try {
        setShowDeleteSuccessModal(true);
        setLoadingDeleteSuccess(true);

        // If the user has selected at least one listing
        if (Object.keys(selectedListingsForDelete).length > 0) {
          // Construct params
          // this hellhole is how we defined it in the contract
          // dont try to understand it too much
          const wantsPieceToSellerTokens: { [key: string]: string[] } = {};

          // for each selected listing
          for (let id in selectedListingsForDelete) {
            // seller-sellerTokenId-wpIdx
            const idArr = id.split("-");
            const listingId = `${idArr[0]}-${idArr[1]}`;
            const wpIdx = idArr[2];

            // get the listing entity using listingId
            const listing = myListings.find((x) => x.id === listingId);

            let tokens = wantsPieceToSellerTokens[listing.wantsPieces[wpIdx]];
            if (tokens && tokens.length > 0) {
              tokens.push(listing.sellerTokenId);
            } else {
              tokens = [listing.sellerTokenId];
            }

            wantsPieceToSellerTokens[listing.wantsPieces[wpIdx]] = tokens;
          }

          let deleteListingParams: DeleteListingsParams = {
            tokenIds: [],
            wanted: [],
          };
          for (let cid in wantsPieceToSellerTokens) {
            deleteListingParams.wanted.push(cid);
            deleteListingParams.tokenIds.push(wantsPieceToSellerTokens[cid]);
          }

          // Get signature
          if (!sessionStorage.getItem(`${account}-signature`)) {
            const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
            sessionStorage.setItem(`${account}-signature`, signature);
          }

          // Delete Listings metatxn
          const response = await axios.post("/api/metatxns", {
            game: config.path,
            action: EMetatransactionActionType.DELETE_LISTINGS,
            params: deleteListingParams,
            ethAddress: account,
            signature: sessionStorage.getItem(`${account}-signature`),
          });
          setTxnHash(response.data.txnHash);
          await waitForTransactionByHash(library, response.data.txnHash);

          setShowDeleteSuccessModal(true);
          setSelectedListingsForDelete({});
          setDeleteMode(false);
        } else {
          setShowDeleteSuccessModal(false);
          setLoadingDeleteSuccess(false);
          setShowErrorModal(true);
          setErrorMessage("You did not select any listings to be deleted");
        }
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage(error.message);
        }
        setShowErrorModal(true);
        setShowDeleteSuccessModal(false);
      } finally {
        setLoadingDeleteSuccess(false);
        setTxnHash("");
      }
    } else {
      setDeleteMode(true);
    }
  }

  async function handleSwapListing(listing: ListingEntity, wpIdx: number) {
    try {
      setShowSwapSuccessModal(true);
      setLoadingSwapSuccess(true);

      // Get buyer token id
      const buyerToken = myPieces.find(
        (x) => x.cid === listing.wantsPieces[wpIdx]
      );

      if (!buyerToken) {
        throw new Error(
          "You cannot execute this swap as you don't have the required piece"
        );
      }

      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Swap listing metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.FULFILL_LISTING,
        params: {
          sellerTokenId: listing.sellerTokenId,
          buyerTokenId: buyerToken.token_id,
          seller: listing.seller,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });
      setTxnHash(response.data.txnHash);
      // Wait for txn to be mined
      await waitForTransactionByHash(library, response.data.txnHash);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowSwapSuccessModal(false);
      setShowErrorModal(true);
    } finally {
      setLoadingSwapSuccess(false);
      setTxnHash("");
    }
  }

  async function handleAddListings(tokenIds: string[], wantsPiece: string) {
    try {
      setShowAddListingModal(false);
      setShowAddListingSuccessModal(true);
      setLoadingAddListingSuccess(true);

      // Get signature
      if (!sessionStorage.getItem(`${account}-signature`)) {
        const signature = await personalSign(LOGIN_SIGNING_MESSAGE);
        sessionStorage.setItem(`${account}-signature`, signature);
      }

      // Add Listings metatxn
      const response = await axios.post("/api/metatxns", {
        game: config.path,
        action: EMetatransactionActionType.CREATE_LISTING,
        params: {
          sellerTokenIds: tokenIds,
          wants: wantsPiece,
        },
        ethAddress: account,
        signature: sessionStorage.getItem(`${account}-signature`),
      });

      // Wait for txn to be mined
      setTxnHash(response.data.txnHash);
      await waitForTransactionByHash(library, response.data.txnHash);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(error.message);
      }
      setShowErrorModal(true);
      setShowAddListingSuccessModal(false);
    } finally {
      setLoadingAddListingSuccess(false);
      setTxnHash("");
    }
  }

  async function getOngoingPuzzles() {
    let tempAllPiecesByPuzzleName: {
      [key: string]: { cid: string; image: string }[];
    } = {};
    const ongoingPuzzlesResponse = await axios.get<Puzzle[]>(
      `/api/puzzles/live`
    );
    const ongoingPuzzles = ongoingPuzzlesResponse.data.filter(
      (p) => p.group_id === config.dropConfig.activePuzzleGroup
    );
    if (ongoingPuzzles && ongoingPuzzles.length > 0) {
      ongoingPuzzles.map((puzzle) => {
        let res: { cid: string; image: string }[] = [];
        for (let i = 0; i < puzzle.pieces_image_urls.length; i++) {
          res.push({
            cid: puzzle.pieces[i],
            image: puzzle.pieces_image_urls[i],
          });
        }
        tempAllPiecesByPuzzleName[puzzle.name] = shuffle(res);
      });

      setAllPiecesByPuzzleName(tempAllPiecesByPuzzleName);
    }
  }

  async function getListings() {
    try {
      const tempActiveListingsResponse = await axios.get<ListingEntity[]>(
        `/api/listings`,
        {
          params: {
            timestamp: timestamp,
          },
        }
      );
      let oldActiveListings = [];
      oldActiveListings.push(...activeListings);
      let tempActiveListings: ListingEntity[] =
        tempActiveListingsResponse.data.filter((l) =>
          filterActiveWantsPieces(l)
        );
      if (tempActiveListings && tempActiveListings.length > 0) {
        setTimestamp(
          tempActiveListings[tempActiveListings.length - 1].timestamp
        );
        setLoadMoreListings(true);
      } else {
        setLoadMoreListings(false);
      }
      oldActiveListings.push(...tempActiveListings);
      setActiveListings(oldActiveListings);
    } catch (e) {
      console.error(e);
      setShowErrorModal(true);
    }
  }

  useEffect(() => {
    if (account && config) {
      setLoading(true);
      Promise.all([
        getListings(),
        getOngoingPuzzles(),
        fetchLivePieces(),
        fetchSwapHistoryBought(),
        fetchSwapHistorySold(),
        fetchMyListings(),
      ]).then(() => setLoading(false));
    }
  }, [account, config]);

  if (!config) {
    return null;
  }

  return (
    <MainContainer game={config}>
      <PageSectionTitle>Marketplace</PageSectionTitle>

      {!isConnected ? (
        <EmptyAndErrorState
          image="/wallet.png"
          alt="no wallet connected"
          message="Please sign in to view the marketplace"
        />
      ) : (
        <>
          <div className="hidden md:block">
            <div className="flex items-center justify-between mt-8 pb-5 border-b border-gray-800">
              <div className="flex space-x-4">
                <GroupedButton
                  selected={isView("all-listings")}
                  onClick={() => setView("all-listings")}
                >
                  All Listings
                </GroupedButton>
                <GroupedButton
                  selected={isView("my-listings")}
                  onClick={() => setView("my-listings")}
                >
                  My Listings
                </GroupedButton>
                <GroupedButton
                  selected={isView("swap-history")}
                  onClick={() => setView("swap-history")}
                >
                  Swap History
                </GroupedButton>
              </div>
              <div className="flex items-center">
                {/* <div className="hidden md:inline-block mr-3">
                  <Select
                    items={["All", ...Object.keys(allPiecesByPuzzleName)]}
                    currentValue={selectedFilter}
                    setValue={setSelectedFilter}
                  />
                </div> */}
                <GradientButton
                  className="mr-3"
                  onClick={() => {
                    if (Object.keys(allPiecesByPuzzleName).length > 0)
                      setShowAddListingModal(true);
                  }}
                >
                  Add Listing
                </GradientButton>
                {deleteMode && (
                  <a
                    role="button"
                    hidden={!isView("my-listings")}
                    onClick={() => setDeleteMode(false)}
                  >
                    Cancel Delete
                  </a>
                )}
                <a
                  role="button"
                  hidden={!isView("my-listings")}
                  onClick={handleDeleteClick}
                  className={`px-3 py-2 ${
                    deleteMode
                      ? "bg-red-600 hover:bg-red-700 rounded-xl ml-2"
                      : "text-red-500 hover:text-red-600"
                  }`}
                >
                  {deleteMode ? "Confirm Delete" : "Delete Listings"}
                </a>
              </div>
            </div>
          </div>
          {/* <div className="flex items-center py-8"> */}
          {isLoading ? (
            <LoadingIndicator className="py-4" />
          ) : isView("all-listings") ? (
            <div>
              <InfiniteScroll
                dataLength={activeListings.length}
                next={getListings}
                hasMore={loadMoreListings}
                loader={<LoadingIndicator className="mb-6" />}
              >
                <Listings
                  listings={activeListings}
                  myPieces={myPieces}
                  handleSwapListing={handleSwapListing}
                  view={view}
                  filter={selectedFilter}
                />
              </InfiniteScroll>
            </div>
          ) : isView("my-listings") ? (
            <div>
              <InfiniteScroll
                dataLength={myListings.length}
                next={fetchMyListings}
                hasMore={loadMoreMyListings}
                loader={<LoadingIndicator className="mb-6" />}
              >
                <Listings
                  listings={myListings}
                  myPieces={myPieces}
                  deleteMode={deleteMode}
                  selectedListings={selectedListingsForDelete}
                  setSelectedListings={setSelectedListingsForDelete}
                  view={view}
                  filter={selectedFilter}
                />
              </InfiniteScroll>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {loadingSwapHistory ? (
                <>
                  <PageSectionTitle className="pt-4">Sold</PageSectionTitle>
                  <LoadingIndicator className="pt-8" />

                  <PageSectionTitle className="pt-4">Bought</PageSectionTitle>
                  <LoadingIndicator className="pt-8" />
                </>
              ) : (
                <>
                  <PageSectionTitle className="pt-4">Sold</PageSectionTitle>

                  <div>
                    <InfiniteScroll
                      dataLength={ITEMS_PER_PAGE}
                      next={fetchSwapHistorySold}
                      hasMore={loadMoreSwapHistorySold}
                      loader={<LoadingIndicator className="mb-6" />}
                    >
                      <Listings
                        listings={mySoldListings}
                        myPieces={myPieces}
                        view={view}
                        filter={selectedFilter}
                      />
                    </InfiniteScroll>
                  </div>
                  <PageSectionTitle className="pt-4">Bought</PageSectionTitle>
                  <div>
                    <InfiniteScroll
                      dataLength={ITEMS_PER_PAGE}
                      next={fetchSwapHistoryBought}
                      hasMore={loadMoreSwapHistoryBought}
                      loader={<LoadingIndicator className="mb-6" />}
                    >
                      <Listings
                        listings={myBoughtListings}
                        myPieces={myPieces}
                        view={view}
                        filter={selectedFilter}
                      />
                    </InfiniteScroll>
                  </div>
                </>
              )}
            </div>
          )}
          <Modal
            isOpen={showAddListingModal}
            onClose={() => setShowAddListingModal(false)}
          >
            <AddListing
              myPiecesByPuzzleName={myPiecesByPuzzleName}
              allPiecesByPuzzleName={allPiecesByPuzzleName}
              handleAddListings={handleAddListings}
            />
          </Modal>
          <SuccessModal
            header="Swap Successful"
            isOpen={showSwapSuccessModal}
            loading={loadingSwapSuccess}
            txnHash={txnHash}
            onClose={() => {
              setShowSwapSuccessModal(false);
              router.reload();
            }}
          >
            You've successfully traded a listing
          </SuccessModal>
          <SuccessModal
            header="Delete Successful"
            isOpen={showDeleteSuccessModal}
            loading={loadingDeleteSuccess}
            txnHash={txnHash}
            onClose={() => {
              setShowDeleteSuccessModal(false);
              router.reload();
            }}
          >
            You've successfully deleted your listing(s)
          </SuccessModal>
          <SuccessModal
            header="Add Listings Successful"
            isOpen={showAddListingSuccessModal}
            loading={loadingAddListingSuccess}
            txnHash={txnHash}
            onClose={() => {
              setShowAddListingSuccessModal(false);
              router.reload();
            }}
          >
            You've successfully added your listing(s)
          </SuccessModal>
          <FailureModal
            header="Network Error"
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
          >
            {errorMessage}
          </FailureModal>
        </>
      )}
    </MainContainer>
  );
}
