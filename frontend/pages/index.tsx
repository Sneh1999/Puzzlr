import { GradientSpan } from "components/GradientSpan";
import { HowItWorks } from "components/HowItWorks";
import { MainContainer } from "components/MainContainer";
import { OpenCollectTrade } from "components/OpenCollectTrade";
import { ShowcaseImage } from "components/ShowcaseImage";
import { ROUTES } from "constants/routes";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import connectedLine from "public/connected-line.svg";
import hero from "public/hero.png";
import howItWorks1 from "public/how-it-works-1.svg";
import howItWorks2 from "public/how-it-works-2.svg";
import howItWorks3 from "public/how-it-works-3.svg";
import React from "react";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Puzzlr</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainContainer>
        <div className="flex items-center justify-between mx-auto">
          <div className="flex flex-col space-y-4">
            <OpenCollectTrade />
            <div>
              <GradientSpan>collect 'em</GradientSpan>
              <br />
              <GradientSpan>all</GradientSpan>
            </div>
            <div className="text-gray-500 font-light w-4/5">
              Collect all the pieces and finish a puzzle, first one to do so
              will win the unique ownership of that NFT piece.
            </div>
          </div>
          <div className="hidden lg:block">
            <Image src={hero} alt="abstract jig-saw puzzle" />
          </div>
        </div>

        <h2 className="uppercase text-center pt-24 text-5xl font-semibold">
          Drops
        </h2>

        <div className="flex flex-wrap justify-evenly">
          <div
            className="flex-shrink-0 my-12 mx-8 cursor-pointer transition hover:ease-in duration-500 transform hover:scale-105"
            onClick={() => {
              router.push("/nearcomm");
            }}
          >
            <div className="h-72 border-2 border-transparent npd-border-gradient rounded-lg flex justify-between">
              <div className="w-48 flex flex-col justify-center items-center">
                <h2 className="uppercase font-semibold text-3xl">Near</h2>
                <h2 className="uppercase font-semibold text-xl">x</h2>
                <h2 className="uppercase font-semibold text-3xl">Comm</h2>
                <div className="animate-pulse z-50 m-4 p-2 border-4 border-green-300 rounded-full justify-self-end">
                  <p>Active Now!</p>
                </div>
              </div>
              <ShowcaseImage src="/near-logo.png" alt="NearComms" />
            </div>
          </div>
        </div>

        <h2 className="uppercase text-center pt-12 text-5xl font-semibold">
          How it works
        </h2>
        <p className="text-center mt-7">
          Follow the steps below to get your first piece right away.
        </p>
        <p className="text-center">Remember, it’s a race!</p>
        <div className="flex items-center justify-center pt-24 pb-24 space-x-8">
          <HowItWorks
            src={howItWorks1}
            alt="Buy packs"
            stepNum={1}
            text={
              <>Acquire pieces through airdrops, trading, and scavenger hunts</>
            }
          />
          <div className="hidden lg:block">
            <Image src={connectedLine} alt="Connector" />
          </div>
          <HowItWorks
            src={howItWorks2}
            alt="Trade with other players"
            stepNum={2}
            text={
              <>
                Solve puzzles and <br />
                trade pieces on the Marketplace
              </>
            }
          />
          <div className="hidden lg:block">
            <Image src={connectedLine} alt="Connector" />
          </div>
          <HowItWorks
            src={howItWorks3}
            alt="Complete puzzle first"
            stepNum={3}
            text={
              <>Be the first one to complete the puzzle and claim your prize</>
            }
          />
        </div>
      </MainContainer>
    </>
  );
}
