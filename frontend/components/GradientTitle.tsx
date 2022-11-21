import clsx from "clsx";
import { THEME } from "constants/theme";

interface Props {
  className?: string;
  center?: boolean;
  size?: "base" | "large";
}

export const GradientTitle: React.FC<Props> = ({
  children,
  center = false,
  className = "",
  size = "base",
}) => (
  <h2
    className={clsx(
      `w-min whitespace-nowrap uppercase font-bold bg-clip-text text-transparent ${THEME.gradients.roseToIndigo}`,
      {
        [className]: !!className,
        "mx-auto": center,
        "text-6xl": size === "large",
        "text-4xl": size === "base",
      }
    )}
  >
    {children}
  </h2>
);
