import { EmptyAndErrorState } from "components/EmptyAndErrorState";
import { FailureModal } from "components/FailureModal";
import { MainContainer } from "components/MainContainer";
import { PageSectionSubtitle } from "components/PageSectionSubtitle";
import { PageSectionTitle } from "components/PageSectionTitle";
import { ROUTES } from "constants/routes";
import gameConfig from "gameConfig";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { Puzzle } from "models/types/Puzzle";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getLivePuzzles } from "pages/api/puzzles/live";
import { FETCH_PUZZLE_BY_IDS } from "queries";
import React, { useEffect, useState } from "react";
import { getIPFSGatewayLink } from "utils/getIPFSGatewayLink";
import { subgraphQuery } from "utils/subgraphQuery";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Redirect if game parameter is invalid
    const game = context.query.game as string;
    const config = gameConfig[game] as IGameConfig;
    if (!config) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    let ongoingPuzzles = await getLivePuzzles();
    let filteredPuzzles = ongoingPuzzles.filter(
      (p) => p.group_id === config.dropConfig.activePuzzleGroup
    );
    const ids = filteredPuzzles.map(
      (puzzle) => `${puzzle.group_id}-${puzzle.id}`
    );
    const response = await subgraphQuery(FETCH_PUZZLE_BY_IDS(ids));
    filteredPuzzles = filteredPuzzles.map((ongoingPuzzle) => {
      ongoingPuzzle.remaining_winners = response.puzzles.find(
        (puzzle) =>
          puzzle.id === `${ongoingPuzzle.group_id}-${ongoingPuzzle.id}`
      ).remainingWinners;
      return ongoingPuzzle;
    });
    return {
      props: {
        ongoingPuzzles: filteredPuzzles,
        config: config,
        hadError: false,
        errorMessage: "",
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        config: {},
        ongoingPuzzles: [],
        hadError: true,
        errorMessage: error.message,
      },
    };
  }
};

interface PuzzlesProps {
  ongoingPuzzles: Puzzle[];
  config: IGameConfig;
  hadError: boolean;
  errorMessage: string;
}

export default function Puzzles({
  ongoingPuzzles,
  config,
  hadError,
  errorMessage,
}: PuzzlesProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hadError) {
      setShowErrorModal(true);
    }
  }, []);

  return (
    <MainContainer game={config}>
      <PageSectionTitle>Ongoing Puzzles</PageSectionTitle>
      <PageSectionSubtitle className="text-base mt-2 text-pink-200">
        <a href={config.url} target="_blank">
          {config.title}
        </a>
      </PageSectionSubtitle>

      {ongoingPuzzles.length === 0 ? (
        <div className="my-16 flex justify-center">
          <EmptyAndErrorState
            image="/hand.png"
            alt="No ongoing puzzles"
            message="No ongoing puzzles"
          />
        </div>
      ) : (
        <div className="flex space-x-12 my-8">
          {ongoingPuzzles.map((puzzle, idx) => (
            <div className="w-80" key={idx}>
              <div
                className="overflow-hidden rounded-xl cursor-pointer transition duration-300 ease-in-out transform hover:-translate-y-1"
                onClick={() =>
                  router.push(
                    `${ROUTES.PUZZLES}/[id]`,
                    `/${config.path}/puzzles/${puzzle.id}`
                  )
                }
              >
                <img
                  className="object-cover object-center w-full h-64"
                  src={getIPFSGatewayLink(puzzle.artwork)}
                />
              </div>
              <h4 className="text-base mt-3 mb-2 font-semibold">
                {puzzle.name}
              </h4>
              {puzzle.description ? (
                <>
                  <div className="pt-1 border-b border-gray-700" />
                  <h6 className="pt-2 text-sm">{puzzle.description}</h6>
                  {/* <h6 className="pt-2 text-sm">
                    {puzzle.remaining_winners}/{puzzle.max_winners} Remaining
                  </h6> */}
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}
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
