import type { BigNumberish } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";

export function shortenHex(hex: string, length = 4) {
  return `${hex.substring(0, length + 2)}…${hex.substring(
    hex.length - length
  )}`;
}

export function formatEtherscanLink(
  type: "Account" | "Transaction",
  data: [number, string]
) {
  switch (type) {
    case "Account": {
      const [chainId, address] = data;
      return `https://testnet.aurorascan.dev//address/${address}`;
    }
    case "Transaction": {
      const [chainId, hash] = data;
      return `https://testnet.aurorascan.dev//tx/${hash}`;
    }
  }
}

export const parseBalance = (
  balance: BigNumberish,
  decimals = 18,
  decimalsToDisplay = 3
) => Number(formatUnits(balance, decimals)).toFixed(decimalsToDisplay);
