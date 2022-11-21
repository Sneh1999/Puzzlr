import clsx from "clsx";

interface Props {
  className?: string;
}
export const PageSectionSubtitle: React.FC<Props> = ({
  children,
  className,
}) => {
  const classNames = clsx("text-gray-500 text-sm", {
    [className]: className,
  });
  return <h1 className={classNames}>{children}</h1>;
};
