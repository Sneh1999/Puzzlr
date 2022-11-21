import { THEME } from "constants/theme";
import { Loading } from "icons/loading";
import clsx from "clsx";

type ButtonType =
  | "border-gradient"
  | "bg-gradient"
  | "custom-bg"
  | "none"
  | "danger-link";
type ButtonSize = "base" | "large";

interface Props {
  loading?: boolean;
  type?: ButtonType;
  onClick?: React.MouseEventHandler<HTMLElement>;
  className?: string;
  disabled?: boolean;
  size?: ButtonSize;
}

export const Button: React.FC<Props> = ({
  className,
  children,
  onClick,
  loading,
  disabled,
  type = "bg-gradient",
  size = "base",
}) => {
  const baseClasses = [
    "cursor-pointer",
    "px-3",
    "py-2",
    "rounded-xl",
    "text-white",
    "focus:outline-none",
    "inline-flex",
    "items-center",
    "w-min",
    "whitespace-nowrap",
    className,
  ];
  const classes = clsx(baseClasses, {
    "border-2 border-transparent npd-border-gradient hover:npd-border-gradient":
      type === "border-gradient",
    [`${THEME.gradients.roseToIndigo}`]: type === "bg-gradient",
    "text-lg px-4 py-3 font-medium": size === "large",
    "text-red-500 hover:text-red-600": type === "danger-link",
    "text-gray-600 border-gray-600 cursor-not-allowed": disabled,
  });
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <Loading /> : null}
      {children}
    </button>
  );
};
