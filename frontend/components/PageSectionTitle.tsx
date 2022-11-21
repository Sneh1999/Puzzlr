import clsx from "clsx";

interface Props {
  className?: string;
}

export const PageSectionTitle: React.FC<Props> = ({ children, className }) => {
  return (
    <h1
      className={clsx("uppercase text-3xl font-bold", {
        [className]: className,
      })}
    >
      {children}
    </h1>
  );
};
