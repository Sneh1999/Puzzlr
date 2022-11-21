import { useCallback, useEffect } from "react";
import { LoadingIndicator } from "components/LoadingIndicator";
import { ViewOnEtherscan } from "./ViewOnEtherscan";

interface Props {
  loading?: boolean;
  loadingStateMessage?: string;
  txnHash?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({
  children,
  loading,
  txnHash,
  loadingStateMessage,
  isOpen,
  onClose,
}) => {
  const onKeydown = useCallback((e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      onClose();
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" role="dialog">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-gray-800 rounded-2xl overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:px-10 sm:max-w-2xl sm:w-full">
          {loading ? (
            <LoadingIndicator className="py-24">
              {loadingStateMessage ? (
                <div className="text-gray-500">{loadingStateMessage}</div>
              ) : null}
              {txnHash ? <ViewOnEtherscan txnHash={txnHash} /> : null}
            </LoadingIndicator>
          ) : (
            children
          )}
          <div className="px-4 py-3 flex justify-center">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-gray-300 hover:text-white focus:outline-none sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
