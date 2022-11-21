import { InjectedConnector } from "@web3-react/injected-connector";
import { TorusConnector } from "@web3-react/torus-connector";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
console.log(`ChainId ${chainId}`);

let host = "aurora";
let networkName = "Aurora Testnet";

export const injected = new InjectedConnector({
  supportedChainIds: [chainId],
});

export const torusConnector = new TorusConnector({
  chainId: chainId,
  initOptions: {
    enableLogging: true, // default: false
    network: {
      host: host,
      chainId: chainId, // default: 1
      networkName: networkName,
    },
  },
});
