import React from "react";
import { Modal } from "./Modal";

interface Props {
  loading?: boolean;
  loadingStateMessage?: string;
  txnHash?: string;
  isOpen: boolean;
  onClose: () => void;
  header: string;
}

export const FailureModal: React.FC<Props> = ({
  loading,
  loadingStateMessage,
  txnHash,
  isOpen,
  onClose,
  header,
  children,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    loading={loading}
    loadingStateMessage={loadingStateMessage}
    txnHash={txnHash}
  >
    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
      <h2 className="text-center font-semibold text-2xl mt-2">😥 {header}</h2>
      <div className="mt-8 flex justify-center">
        <img src="/failure.png" />
      </div>
      <p className="pt-4 text-base text-center text-gray-400">{children}</p>
    </div>
  </Modal>
);
