import React, { useCallback, useEffect } from "react";
import { LoadingIndicator } from "components/LoadingIndicator";
import { Button } from "./Button";

interface Props {
  heading: string;
  subheading: string;
  loading?: boolean;
  loadingButton?: boolean;
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  confirmBtnText: string;
}

export const GradientModal: React.FC<Props> = ({
  heading,
  subheading,
  children,
  loading,
  isOpen,
  loadingButton,
  onClose,
  onConfirm,
  confirmBtnText,
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
          className="fixed inset-0 bg-black transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-black-800 rounded-2xl overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:px-10 sm:max-w-2xl sm:w-full">
          <h2 className="text-center font-semibold text-2xl mt-2">{heading}</h2>
          <h2 className="pt-4 text-sm text-center text-gray-400 ">
            {subheading}
          </h2>
          {loading ? (
            <LoadingIndicator className="py-32" />
          ) : (
            <>
              {children}
              <div className="flex justify-around">
                {onClose && (
                  <Button
                    type="border-gradient"
                    className="m-4 px-20"
                    //TODO: change values here
                    onClick={onClose}
                  >
                    Go Back
                  </Button>
                )}
                <Button
                  type="bg-gradient"
                  className="m-4 px-20"
                  loading={loadingButton}
                  onClick={onConfirm}
                >
                  {confirmBtnText}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
