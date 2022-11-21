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
        managerAddress: "0x9565E1217F74eD4dcE15A77eFa71310e86F08FBc",
        managerAbi: require("constants/abis/aurora/PuzzleManager.json"),
        pieceFactoryAddress: "0xc7E782f9AcE1edF8EB9E687AEbEb75900FbB4041",
        pieceFactoryAbi: require("constants/abis/aurora/PieceFactory.json"),
        prizeFactoryAddress: "0x7d16F8f198095ded19397671d9df8A428178A06B",
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
