import clsx from "clsx";

interface ShowcaseImageProps {
  src: string;
  className?: string;
  alt?: string;
}

export const ShowcaseImage = ({ src, className, alt }: ShowcaseImageProps) => (
  <img
    src={src}
    className={clsx("h-full z-0 rounded-lg", { [className]: !!className })}
    alt={alt}
  />
);
