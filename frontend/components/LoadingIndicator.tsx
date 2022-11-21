import clsx from "clsx";
import Image from "next/image";
import { formatEtherscanLink } from "utils/eth";
import spinner from "../public/spinner.svg";
import { ExternalLinkIcon } from "@heroicons/react/solid";

interface IProps {
  className?: string;
  children?: any;
}

export const LoadingIndicator = ({ className, children }: IProps) => {
  return (
    <div
      className={clsx("flex flex-col space-y-4 justify-center", {
        [className]: className,
      })}
    >
      <Image className="animate-spin" src={spinner} alt="loading" />
      {children}
    </div>
  );
};
