import { IGameConfig } from "models/interfaces/IGameConfig";

const gameConfig: { [key: string]: IGameConfig } = {
  nearcomm: {
    path: "nearcomm",
    title: "NearComm",
    body: "NearComm is a unique NFT artwork tailored towards the community in the Near Ecosystem 👾",
    url: "https://near.org/ecosystem/community/",
    twitterHandle: "@nearprotocol",
    ui: {
      background: "bg-animetas-solid",
      logo: "https://i.imgur.com/3PAD6Lq.png",
      font: "font-animetas",
    },
    showcaseImages: [
      "/aurora/1.webp",
      "/aurora/2.jpeg",
      "/aurora/3.jpg",
      "/aurora/4.jpeg",
    ],
    networkConfig: {
      aurora: {
        managerAddress: "0x074eb4915A1E817646c411837Ee2992595c83084",
        managerAbi: require("constants/abis/aurora/PuzzleManager.json"),
        pieceFactoryAddress: "0x6925C3B2d23Cb442eF01725a9Dc62826B6F8fBd4",
        pieceFactoryAbi: require("constants/abis/aurora/PieceFactory.json"),
        prizeFactoryAddress: "0x8f19FB132B011d09e29fAc6708f58a61c10C90D8",
        prizeFactoryAbi: require("constants/abis/aurora/PrizeFactory.json"),
      },
    },
    dropConfig: {
      activePuzzleGroup: 2,
      pastPuzzleGroups: [],
      packPurchasesEnabled: true,
      tradeInEnabled: false,
    },
    packs: [
      {
        name: "NearCommPack 👾",
        tier: 0,
        numPieces: 10,
        price: 0,
        image: "/gold.png",
      },
    ],
  },
};

export default gameConfig;
