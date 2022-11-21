import clsx from "clsx";
import { THEME } from "constants/theme";
import { Button } from "./Button";

interface GroupedButtonProps {
  selected: boolean;
  onClick: () => void;
}

export const GroupedButton: React.FC<GroupedButtonProps> = ({
  children,
  onClick,
  selected,
}) => {
  return (
    <Button
      type="custom-bg"
      className={clsx({
        [`${THEME.gradients.roseToIndigo}`]: selected,
        "text-gray-500 hover:text-white": !selected,
      })}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};
