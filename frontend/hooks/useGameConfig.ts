import gameConfig from "gameConfig";
import { IGameConfig } from "models/interfaces/IGameConfig";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function useGameConfig() {
  const router = useRouter();
  const [config, setConfig] = useState<IGameConfig>();

  useEffect(() => {
    const game = router.query.game as string;

    if (game) {
      const _config = gameConfig[game];
      if (_config && _config.dropConfig.activePuzzleGroup !== undefined) {
        setConfig(_config);
      } else {
        router.replace("/");
      }
    }

    return () => {
      setConfig(null);
    };
  }, [router.query.game]);

  return config;
}
