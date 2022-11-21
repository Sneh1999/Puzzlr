import { ExternalLinkIcon } from "@heroicons/react/solid";
import { formatEtherscanLink } from "utils/eth";

interface IProps {
  txnHash: string;
}

export const ViewOnEtherscan = ({ txnHash }: IProps) => {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const blockchainExplorerLink = formatEtherscanLink("Transaction", [
    chainId,
    txnHash,
  ]);

  return (
    <div className="text-gray-400">
      <a
        href={blockchainExplorerLink}
        className="flex justify-center"
        target="_blank"
      >
        View on AuroraScan
        <ExternalLinkIcon className="h-5 ml-2" />
      </a>
    </div>
  );
};
