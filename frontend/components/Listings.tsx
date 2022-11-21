import { useWeb3React } from "@web3-react/core";
import { ListingEntity } from "models/types/ListingEntity";
import { Piece } from "models/types/Piece";
import swapPng from "public/swap.png";
import Image from "next/image";
import { MarketplaceView } from "pages/[game]/marketplace";
import React, { useEffect, useState } from "react";
import { formatEtherscanLink, shortenHex } from "utils/eth";
import { Button } from "./Button";
import { EmptyAndErrorState } from "./EmptyAndErrorState";
import { GradientButton } from "./GradientButton";
import { Modal } from "./Modal";

interface ListingsProps {
  listings: ListingEntity[];
  myPieces: Piece[];
  filter: string;
  deleteMode?: boolean;
  selectedListings?: {
    [key: string]: boolean;
  };
  setSelectedListings?: React.Dispatch<
    React.SetStateAction<{
      [key: number]: boolean;
    }>
  >;
  handleSwapListing?: (listing: ListingEntity, wpIdx: number) => Promise<void>;
  view?: MarketplaceView;
}

export function Listings({
  listings,
  myPieces,
  deleteMode,
  selectedListings,
  setSelectedListings,
  handleSwapListing,
  view,
  filter,
}: ListingsProps) {
  const { account, chainId } = useWeb3React();
  const [toBeSwappedListing, setToBeSwappedListing] = useState<ListingEntity>();
  const [toBeSwappedListingWantsPieceIdx, setToBeSwappedListingWantsPieceIdx] =
    useState(-1);
  const [showSwapConfirmModal, setShowSwapConfirmModal] = useState(false);
  const [filteredListings, setFilteredListings] = useState<ListingEntity[]>([]);

  useEffect(() => {
    if (filter === "All") setFilteredListings(listings);
    console.log(listings);

    // NOTE: Disabled because we don't use the filter dropdown right now
    // and this was easier than solving bugs
    // else {
    //   let tempFilteredListings = listings.filter(
    //     (listing) =>
    //       listing.sellerTokenPuzzleName === filter ||
    //       listing.wantsPiecePuzzleName === filter
    //   );
    //   setFilteredListings(tempFilteredListings);
    // }
  }, [listings]);
  function isSelected(id: string) {
    if (deleteMode && selectedListings[id]) {
      return true;
    }
    return false;
  }

  function isPieceOwned(cid: string) {
    if (myPieces) {
      if (myPieces.findIndex((piece) => piece.cid === cid) > -1) {
        return true;
      }
    }
    return false;
  }

  function handleSelectListing(id: string) {
    let tempSelectedListings = { ...selectedListings };
    if (tempSelectedListings[id]) delete tempSelectedListings[id];
    else tempSelectedListings[id] = true;

    setSelectedListings(tempSelectedListings);
  }

  return (
    <>
      {filteredListings.length > 0 ? (
        <div className="grid py-8 gap-12 justify-between grid-cols-1 lg:grid-cols-2">
          {filteredListings.map((listing, idx) => {
            if (view === "all-listings" || view === "my-listings") {
              return listing.wantsPieces.map((wp, wpIdx) => (
                <div
                  className={`bg-npt-dark rounded-xl ${
                    isSelected(`${listing.id}-${wpIdx}`)
                      ? "border-2 border-red-900"
                      : "border-2 border-gray-700"
                  }`}
                  key={`${idx}-${wpIdx}`}
                >
                  <div className="flex pl-8 items-center h-12 bg-npt-light-dark rounded-t-xl">
                    <h1>
                      Created By:{" "}
                      <a
                        className="font-semibold"
                        href={formatEtherscanLink("Account", [
                          chainId,
                          listing.seller,
                        ])}
                        target="_blank"
                      >
                        {shortenHex(listing.seller)}
                      </a>
                    </h1>
                  </div>
                  <div className="flex h-52 px-8 my-4 justify-between items-center">
                    <div className="flex flex-col justify-center items-center">
                      <h3 className="text-gray-300 uppercase">You Get</h3>
                      <div className="w-36">
                        <img
                          className="rounded-xl object-cover w-full"
                          src={listing.sellerTokenIdImage}
                        />
                      </div>
                      <h1 className="text-sm text-gray-300 uppercase pt-2">
                        {listing.sellerTokenPuzzleName}
                      </h1>
                    </div>

                    {deleteMode ? (
                      <Button
                        type="danger-link"
                        className="px-8 border border-red-600"
                        onClick={() =>
                          handleSelectListing(`${listing.id}-${wpIdx}`)
                        }
                      >
                        {isSelected(`${listing.id}-${wpIdx}`)
                          ? "Unselect"
                          : "Select"}
                      </Button>
                    ) : (
                      <GradientButton
                        className={`px-8 mx-8 ${
                          view === "all-listings" &&
                          listing.seller.toLowerCase() !== account.toLowerCase()
                            ? null
                            : "hidden"
                        }`}
                        onClick={() => {
                          if (isPieceOwned(wp)) {
                            setToBeSwappedListing(listing);
                            setToBeSwappedListingWantsPieceIdx(wpIdx);
                            setShowSwapConfirmModal(true);
                          }
                        }}
                        disabled={!isPieceOwned(wp)}
                      >
                        Swap
                      </GradientButton>
                    )}

                    <div className="flex flex-col justify-center items-center">
                      <h3 className="text-gray-300 uppercase">You Give</h3>

                      <div className="w-36">
                        <img
                          className="rounded-xl object-cover w-full"
                          src={listing.wantsPiecesImages[wpIdx]}
                        />
                      </div>
                      <h1 className="text-sm text-gray-300 uppercase pt-2">
                        {listing.wantsPiecesPuzzleNames[wpIdx]}
                      </h1>
                    </div>
                  </div>
                </div>
              ));
            } else {
              return (
                <div
                  className="bg-npt-dark rounded-xl border-2 border-gray-700"
                  key={`${idx}`}
                >
                  <div className="flex pl-8 items-center h-12 bg-npt-light-dark rounded-t-xl">
                    <h1>
                      Created By:{" "}
                      <a
                        className="font-semibold"
                        href={formatEtherscanLink("Account", [
                          chainId,
                          listing.seller,
                        ])}
                        target="_blank"
                      >
                        {shortenHex(listing.seller)}
                      </a>
                    </h1>
                  </div>
                  <div className="flex h-52 px-8 my-4 justify-between items-center">
                    <div className="flex flex-col justify-center items-center">
                      <h3 className="text-gray-300 uppercase">You Get</h3>
                      <div className="w-36">
                        <img
                          className="rounded-xl object-cover w-full"
                          src={listing.sellerTokenIdImage}
                        />
                      </div>
                      <h1 className="text-sm text-gray-300 uppercase pt-2">
                        {listing.sellerTokenPuzzleName}
                      </h1>
                    </div>

                    <GradientButton
                      // FIXME: we might be able to remove this entire component
                      className={`px-8 mx-8 hidden`}
                      onClick={() => {}}
                    >
                      Swap
                    </GradientButton>

                    <div className="flex flex-col justify-center items-center">
                      <h3 className="text-gray-300 uppercase">You Give</h3>

                      <div className="w-36">
                        <img
                          className="rounded-xl object-cover w-full"
                          src={listing.buyerPieceImage}
                        />
                      </div>
                      <h1 className="text-sm text-gray-300 uppercase pt-2">
                        {listing.buyerPiecePuzzleName}
                      </h1>
                    </div>
                  </div>
                </div>
              );
            }
          })}
          <Modal
            isOpen={
              showSwapConfirmModal &&
              toBeSwappedListing !== undefined &&
              toBeSwappedListingWantsPieceIdx > -1
            }
            onClose={() => setShowSwapConfirmModal(false)}
          >
            <div className="px-4 pt-5 pb-4 h-96 sm:p-6 sm:pb-4">
              <h2 className="text-center font-semibold text-2xl mt-2">
                🤔 Confirm Swap
              </h2>
              <p className="text-center font-light pt-4">
                Are you sure you want to execute this swap?
              </p>

              <div className="flex px-8 mt-4 justify-between items-center">
                <div className="flex flex-col justify-center items-center">
                  <h3 className="text-gray-300 uppercase">You Get</h3>
                  <div className="w-36">
                    <img
                      className="rounded-xl object-cover w-full"
                      src={toBeSwappedListing?.sellerTokenIdImage}
                    />
                  </div>
                  <h1 className="text-sm text-gray-300 uppercase pt-2">
                    {toBeSwappedListing?.sellerTokenPuzzleName}
                  </h1>
                </div>

                <Image src={swapPng} />

                <div className="flex flex-col justify-center items-center">
                  <h3 className="text-gray-300 uppercase">You Give</h3>
                  <div className="w-36">
                    <img
                      className="rounded-xl object-cover w-full"
                      src={
                        toBeSwappedListing?.wantsPiecesImages[
                          toBeSwappedListingWantsPieceIdx
                        ]
                      }
                    />
                  </div>
                  <h1 className="text-sm text-gray-300 uppercase pt-2">
                    {
                      toBeSwappedListing?.wantsPiecesPuzzleNames[
                        toBeSwappedListingWantsPieceIdx
                      ]
                    }
                  </h1>
                </div>
              </div>
              <Button
                className="mb-8"
                onClick={() => {
                  handleSwapListing(
                    toBeSwappedListing,
                    toBeSwappedListingWantsPieceIdx
                  );
                  setShowSwapConfirmModal(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </Modal>
        </div>
      ) : (
        <EmptyAndErrorState
          className="my-8"
          message="No listings found"
          image="/magnifying-glass.png"
          alt="no listings"
        />
      )}
    </>
  );
}
