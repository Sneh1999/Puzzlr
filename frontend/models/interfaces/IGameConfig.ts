import { ContractInterface } from "ethers";
import { EPackTiers } from "models/enums/EPackTiers";

export interface IGameConfig {
  path: string;
  title: string;
  body: string;
  url: string;
  ui?: {
    background?: string;
    font?: string;
    logo?: string;
    header?: string;
  };
  twitterHandle: string;
  showcaseImages: string[];
  networkConfig: {
    aurora: INetworkConfig;
  };
  dropConfig: IDropConfig;
  packs: IPackConfig[];
}

export interface INetworkConfig {
  managerAddress: string;
  managerAbi: ContractInterface;
  pieceFactoryAddress: string;
  pieceFactoryAbi: ContractInterface;
  prizeFactoryAddress: string;
  prizeFactoryAbi: ContractInterface;
}

export interface IDropConfig {
  activePuzzleGroup: number;
  pastPuzzleGroups: number[];
  packPurchasesEnabled: boolean;
  tradeInEnabled?: boolean;
}

export interface IPackConfig {
  name: string;
  tier: EPackTiers; // uint8 code representing pack tier
  numPieces: number;
  tradeInPrice?: number;
  price: number;
  image: string;
}
