import React, { useState, createContext, useEffect } from "react";
import { SearchIcon } from "@heroicons/react/outline";
import { Piece } from "models/types/Piece";
import { Accordion, AccordionItem, AccordionPanel } from "./Accordion";
import { Button } from "./Button";
import { Select } from "components/Select";
import { ImageCard } from "./ImageCard";
import { PageSectionSubtitle } from "./PageSectionSubtitle";
import { PageSectionTitle } from "./PageSectionTitle";
import { Pagination } from "./Pagination";

interface AddListingProps {
  myPiecesByPuzzleName: {
    [key: string]: Piece[];
  };
  allPiecesByPuzzleName: {
    [key: string]: { cid: string; image: string }[];
  };
  handleAddListings: (tokenIds: string[], wantsPiece: string) => Promise<void>;
}

export function AddListing({
  myPiecesByPuzzleName,
  allPiecesByPuzzleName,
  handleAddListings,
}: AddListingProps) {
  const PIECES_PER_PAGE = 4;
  const puzzleNames = Object.keys(allPiecesByPuzzleName);
  const initialBuyPieces =
    puzzleNames.length > 0
      ? allPiecesByPuzzleName[puzzleNames[0]].slice(0, PIECES_PER_PAGE)
      : [];

  // Sell side related states
  const [sellAccordionSelectedItem, setSellAccordionSelectedItem] =
    useState("Choose a puzzle");
  const sellContext = createContext(null);
  const [currPageSellAccordions, setCurrPageSellAccordions] = useState(1);
  const [currPageSellAccordionsPieces, setCurrPageSellAccordionsPieces] =
    useState<Piece[]>([]);
  const [selectedForSale, setSelectedForSale] = useState<string[]>([]);

  // Buy-side related states
  const [buyDropdownSelectedValue, setBuyDropdownSelectedValue] = useState(
    puzzleNames[0]
  );
  const [currPageBuyDropdownPieces, setCurrPageBuyDropdownPieces] =
    useState(initialBuyPieces);
  const [currPageBuyDropdown, setCurrPageBuyDropdown] = useState(1);
  const [selectedForPurchase, setSelectedForPurchase] = useState("");

  useEffect(() => {
    setCurrPageBuyDropdown(1);
    setCurrPageBuyDropdownPieces(
      allPiecesByPuzzleName[buyDropdownSelectedValue].slice(0, PIECES_PER_PAGE)
    );
  }, [buyDropdownSelectedValue]);

  useEffect(() => {
    if (sellAccordionSelectedItem !== "Choose a puzzle") {
      setCurrPageSellAccordions(1);
      if (myPiecesByPuzzleName[sellAccordionSelectedItem]) {
        setCurrPageSellAccordionsPieces(
          myPiecesByPuzzleName[sellAccordionSelectedItem].slice(
            0,
            PIECES_PER_PAGE
          )
        );
      } else {
        setCurrPageSellAccordionsPieces([]);
      }
    }
  }, [sellAccordionSelectedItem]);

  function handleBuyDropdownPageChange(n: number) {
    const startIndex = (n - 1) * PIECES_PER_PAGE;
    setCurrPageBuyDropdownPieces(
      allPiecesByPuzzleName[buyDropdownSelectedValue].slice(
        startIndex,
        startIndex + PIECES_PER_PAGE
      )
    );
    setCurrPageBuyDropdown(n);
  }

  function handleSellPageChange(i: number, n: number) {
    const startIndex = (n - 1) * PIECES_PER_PAGE;
    setCurrPageSellAccordionsPieces(
      myPiecesByPuzzleName[puzzleNames[i]].slice(
        startIndex,
        startIndex + PIECES_PER_PAGE
      )
    );
    setCurrPageSellAccordions(n);
  }

  function handleToggleSelectForSale(tokenId: string) {
    let tempTokenIds = [...selectedForSale];
    const index = tempTokenIds.findIndex((x) => x === tokenId);
    const isUnselecting = index > -1;
    if (isUnselecting) {
      tempTokenIds.splice(index, 1);
    } else {
      tempTokenIds.push(tokenId);
    }
    setSelectedForSale(tempTokenIds);
  }

  function isSelectedForSale(tokenId: string): boolean {
    return selectedForSale.findIndex((x) => x === tokenId) > -1;
  }

  return (
    <div className="flex flex-col flex-wrap p-4">
      <div className="pt-4">
        <PageSectionTitle>Offer</PageSectionTitle>
        <PageSectionSubtitle>
          Select pieces you're willing to sell. You can choose multiple, i.e.
          "willing to sell either X or Y for Z"
        </PageSectionSubtitle>

        <Accordion
          className="pt-4"
          context={sellContext}
          selected={sellAccordionSelectedItem}
          setSelected={setSellAccordionSelectedItem}
        >
          {puzzleNames.map((name, idx) => (
            <div key={`sell-${idx}`}>
              <AccordionItem context={sellContext} toggle={name}>
                {name}
              </AccordionItem>
              <AccordionPanel context={sellContext} id={name}>
                <div className="flex flex-wrap gap-4 py-4 justify-center">
                  {currPageSellAccordionsPieces.length > 0
                    ? currPageSellAccordionsPieces.map((piece, idx) => (
                        <div
                          onClick={() =>
                            handleToggleSelectForSale(piece.token_id)
                          }
                        >
                          <ImageCard
                            bordered={isSelectedForSale(piece.token_id)}
                            src={piece.token_metadata.image_url}
                            width={96}
                            height={96}
                            key={piece.token_id}
                          />
                        </div>
                      ))
                    : null}
                </div>
                {myPiecesByPuzzleName[sellAccordionSelectedItem] ? (
                  <Pagination
                    pageCount={Math.ceil(
                      myPiecesByPuzzleName[sellAccordionSelectedItem].length /
                        PIECES_PER_PAGE
                    )}
                    value={currPageSellAccordions}
                    onPageChange={(n) => handleSellPageChange(idx, n)}
                  />
                ) : null}
              </AccordionPanel>
            </div>
          ))}
        </Accordion>
      </div>
      <div className="pt-4">
        <PageSectionTitle>Ask</PageSectionTitle>
        <PageSectionSubtitle>
          Select one piece you're looking for. Your multiple sale pieces will go
          up as individual listings against this piece.
        </PageSectionSubtitle>

        <div className="pt-4">
          <Select
            icon={<SearchIcon className="h-5 w-5" />}
            items={puzzleNames}
            currentValue={buyDropdownSelectedValue}
            setValue={setBuyDropdownSelectedValue}
          />

          <div className="flex flex-wrap gap-4 pt-4 justify-center">
            {currPageBuyDropdownPieces.map((piece, idx) => (
              <div onClick={() => setSelectedForPurchase(piece.cid)}>
                <ImageCard
                  bordered={selectedForPurchase === piece.cid}
                  src={piece.image}
                  width={96}
                  height={96}
                  key={idx}
                />
              </div>
            ))}
          </div>

          <Pagination
            pageCount={Math.ceil(
              allPiecesByPuzzleName[buyDropdownSelectedValue].length /
                PIECES_PER_PAGE
            )}
            value={currPageBuyDropdown}
            onPageChange={handleBuyDropdownPageChange}
          />
        </div>

        <div className="pt-4">
          <Button
            disabled={!(selectedForSale.length > 0 && selectedForPurchase)}
            onClick={() =>
              handleAddListings(selectedForSale, selectedForPurchase)
            }
          >
            Add Multiple Listings
          </Button>
        </div>
      </div>
    </div>
  );
}
