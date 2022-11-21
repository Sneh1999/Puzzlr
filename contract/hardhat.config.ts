import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv"; // Env
dotenv.config();

const private_key = process.env.PRIVATE_KEY;
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    aurora: {
      url: process.env.AURORA_URL,
      accounts: [private_key ? private_key : ""],
    },
  },
  etherscan: {
    apiKey: {
      auroraTestnet: "BYY7NQEPFEIF15KMZDCG3QQGVG6VJYGBYI",
    },
  },
};

export default config;
