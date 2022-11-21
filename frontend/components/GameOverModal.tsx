import { useEffect, useState } from "react";
import { Modal } from "components/Modal";
import { useGameOverModal, IGameOverModalStore } from "stores/useGameOverModal";
import { ImageCard } from "components/ImageCard";
import clsx from "clsx";
import gameConfig from "gameConfig";
import { getIPFSGatewayLink } from "utils/getIPFSGatewayLink";
import { useRouter } from "next/router";
import { IGameConfig } from "models/interfaces/IGameConfig";

const selector = (state: IGameOverModalStore) => ({
  open: state.open,
  close: state.close,
  puzzlesWon: state.puzzlesWon,
  subscribe: state.subscribe,
  unsubscribe: state.unsubscribe,
});

export const GameOverModal: React.FC = () => {
  const router = useRouter();
  const { open, close, puzzlesWon, subscribe, unsubscribe } =
    useGameOverModal(selector);
  const [config, setConfig] = useState<IGameConfig>();

  useEffect(() => {
    if (router.query.game) {
      const game = router.query.game as string;
      const _config = gameConfig[game] as IGameConfig;

      if (_config === undefined) {
        return;
      }

      setConfig(_config);
      subscribe(_config.dropConfig.activePuzzleGroup);
      return () => unsubscribe();
    }
  }, [router.query.game]);

  if (!config) {
    return null;
  }

  return (
    <Modal isOpen={open} onClose={close}>
      <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <h2 className="text-center font-semibold text-2xl mt-2">
          🚨 Puzzle(s) Over! GG
        </h2>
        <div
          className={clsx({
            "mx-auto mt-8": puzzlesWon.length === 1,
            "grid grid-cols-2 mt-8 gap-4": puzzlesWon.length > 1,
          })}
        >
          {puzzlesWon.map((puzzle, idx) => (
            <ImageCard
              key={idx}
              src={getIPFSGatewayLink(puzzle.artwork)}
              width={200}
              height={200}
              title={puzzle.name}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};
