import { useWeb3React } from "@web3-react/core";
import useContract from "hooks/useContract";
import { IGameConfig } from "models/interfaces/IGameConfig";

export function usePuzzleManagerContract(
  config: IGameConfig,
  withSigner: boolean = false
) {
  return useContract(
    config.networkConfig.aurora.managerAddress,
    config.networkConfig.aurora.managerAbi,
    withSigner
  );
}
