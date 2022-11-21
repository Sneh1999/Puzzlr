import type {
  ExternalProvider,
  JsonRpcFetchFunc,
} from "@ethersproject/providers";
import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import { GameOverModal } from "components/GameOverModal";
import { Layout } from "components/Layout";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import React, { useEffect } from "react";
import "styles.css";
import * as ga from "utils/gtag";

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new Web3Provider(provider);
}

export default function NextWeb3App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      ga.pageview(url);
    };
    // When the component is mounted, subscribe to router changes
    // and log those page views
    router.events.on("routeChangeComplete", handleRouteChange);

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Puzzlr" />
        <meta
          property="twitter:description"
          content="Building social games for the metaverse."
        />
      </Head>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        {/* <GameOverModal /> */}
      </Web3ReactProvider>
    </>
  );
}
