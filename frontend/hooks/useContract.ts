import { Contract, ContractInterface } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";

export default function useContract(
  address: string,
  ABI: ContractInterface,
  withSigner = false
) {
  const { library, account } = useWeb3React<Web3Provider>();

  return useMemo(
    () =>
      !!address && !!ABI && !!library
        ? new Contract(
            address,
            ABI,
            withSigner ? library.getSigner(account).connectUnchecked() : library
          )
        : undefined,
    [address, ABI, withSigner, library, account]
  );
}
