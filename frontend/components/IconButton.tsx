import clsx from "clsx";

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  selected?: boolean;
  color?: string;
  icon: JSX.Element;
}

export const IconButton: React.FC<Props> = ({
  onClick,
  className,
  color,
  selected,
  children,
  icon,
}) => {
  const baseClasses = [
    "flex",
    "cursor-pointer",
    "rounded-xl",
    "border-2",
    "justify-center",
    "items-center",
    "focus:outline-none",
    "hover:bg-gray-800",
    `border-${color}`,
    "px-2",
    "py-2",
  ];
  return (
    <button
      className={clsx(baseClasses, {
        [className]: !!className,
        [`bg-${color} text-white`]: selected,
      })}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
};
