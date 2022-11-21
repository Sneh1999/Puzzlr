import React from "react";
import { Button } from "./Button";

interface Props {
  imgSrc: string;
  loading: boolean;
  onClick: () => void;
}

export const PackPurchase: React.FC<Props> = ({
  imgSrc,
  loading,
  onClick,
  children,
}) => {
  return (
    <div className="py-20 w-52 flex flex-col items-center space-y-8">
      <img src={imgSrc} alt="Pack" className="transform scale-90" />
      <Button
        type="border-gradient"
        size="base"
        loading={loading}
        onClick={onClick}
      >
        {children}
      </Button>
    </div>
  );
};
