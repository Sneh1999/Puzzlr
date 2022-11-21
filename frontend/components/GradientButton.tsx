import clsx from "clsx";

interface Props {
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

export const GradientButton: React.FC<Props> = ({
  className,
  children,
  disabled,
  onClick,
}) => {
  return (
    <a
      role="button"
      className={clsx(
        "px-3 py-2 rounded-xl cursor-pointer border-2 border-transparent npd-border-gradient focus:outline-none",
        { [className]: !!className },
        { "hover:npd-border-gradient": !disabled },
        { "text-gray-600 border-gray-600 cursor-not-allowed": disabled }
      )}
      onClick={onClick}
    >
      {children}
    </a>
  );
};
