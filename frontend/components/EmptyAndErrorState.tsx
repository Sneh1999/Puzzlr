import clsx from "clsx";

interface Props {
  image: string;
  alt: string;
  message: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyAndErrorState({
  alt,
  image,
  className,
  message,
  children,
}: Props): JSX.Element {
  return (
    <div
      className={clsx(`w-72 mx-auto bg-black rounded-3xl`, {
        [className]: className,
      })}
    >
      <img className="pt-8 mx-auto" src={image} height={116} alt={alt} />
      <div className="w-4/5 pt-4 pb-8 mx-auto font-medium text-center">
        {message}
      </div>
      {children}
    </div>
  );
}
