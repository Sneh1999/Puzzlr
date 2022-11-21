import { ethers, run } from "hardhat";

async function main() {
  const PuzzleManager = await ethers.getContractFactory("PuzzleManager");
  const PieceFactory = await ethers.getContractFactory("PieceFactory");
  const PrizeFactory = await ethers.getContractFactory("PrizeFactory");
  const puzzleManager = PuzzleManager.attach(
    "0x074eb4915A1E817646c411837Ee2992595c83084"
  );
  await puzzleManager.setPackTierContentsSize("10", "0");
}
main();
