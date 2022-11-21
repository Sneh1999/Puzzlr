import Image from "next/image";

interface HowItWorksProps {
  src: StaticImageData;
  alt: string;
  stepNum: number;
  text: React.ReactElement;
}

export const HowItWorks = ({ src, alt, stepNum, text }: HowItWorksProps) => (
  <div className="flex flex-col space-y-4 w-52">
    <Image src={src} alt={alt} />
    <p className="text-center font-medium text-gray-400">Step {stepNum}</p>
    <p className="text-center font-medium">{text}</p>
  </div>
);
