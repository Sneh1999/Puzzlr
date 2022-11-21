import clsx from "clsx";

interface Props {
  src: string;
  showDivider?: boolean;
  subtitle?: string;
  title?: string;
  bordered?: boolean;
  width: number;
  height: number;
  blurred?: boolean;
}

export const ImageCard: React.FC<Props> = ({
  children,
  src,
  showDivider,
  subtitle,
  bordered,
  title,
  width,
  height,
  blurred,
}) => {
  const topLevelClasses = clsx("flex flex-col", {
    ["filter blur-sm"]: blurred,
  });
  return (
    <div className={topLevelClasses}>
      <img
        className={`mx-auto rounded-xl ${
          bordered ? "border-4 border-pink-200" : ""
        }`}
        src={src}
        width={width}
        height={height}
      />
      {title ? (
        <h5 className="text-white pt-2 font-semibold uppercase">{title}</h5>
      ) : null}
      {showDivider ? <div className="pt-1 border-b border-gray-700" /> : null}
      {subtitle ? <h6 className="pt-2 text-sm">{subtitle}</h6> : null}
      {children}
    </div>
  );
};
