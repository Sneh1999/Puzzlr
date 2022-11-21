import { BURN_MANAGER_TEMP_ABI } from "constants/eth";
import useContract from "./useContract";

export function useBurnManagerContract(withSigner: boolean = false) {
  return useContract(
    "0x31beFdc60ee1AC1e66B28858414E1589E5548Fe1",
    BURN_MANAGER_TEMP_ABI,
    withSigner
  );
}
