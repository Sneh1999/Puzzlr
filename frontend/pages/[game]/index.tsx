import { GradientTitle } from "components/GradientTitle";
import { MainContainer } from "components/MainContainer";
import { ShowcaseImage } from "components/ShowcaseImage";
import useGameConfig from "hooks/useGameConfig";
import Head from "next/head";
import Marquee from "react-fast-marquee";

export default function Home() {
  const config = useGameConfig();

  if (!config) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Puzzlr - {config.title}</title>
      </Head>

      <MainContainer game={config}>
        <div className="flex flex-col items-center justify-between mx-auto">
          {config.ui && config.ui.header ? (
            <img src={config.ui.header} />
          ) : (
            <GradientTitle size="large">Puzzlr x {config.title}</GradientTitle>
          )}

          <p className="text-center text-indigo-200 py-4 px-32">
            {config.body}
          </p>

          <h2 className="uppercase text-center pt-12 text-5xl font-semibold">
            Showcase
          </h2>
          <p className="text-center mt-4 text-pink-200">
            <a href={config.url} target="_blank">
              <img src={config.ui.logo} className="h-40" />
            </a>
          </p>

          <div className="my-12">
            <Marquee
              speed={100}
              gradientColor={[22, 22, 22]}
              gradientWidth={320}
            >
              {config.showcaseImages.map((imgUrl) => (
                <ShowcaseImage src={imgUrl} className="h-72 w-72 mx-4" />
              ))}
            </Marquee>
          </div>
        </div>
      </MainContainer>
    </>
  );
}
