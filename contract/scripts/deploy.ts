import { ethers, run } from "hardhat";

async function main() {
  // Get PuzzleManager contract factory
  const PuzzleManager = await ethers.getContractFactory("PuzzleManager");
  const PieceFactory = await ethers.getContractFactory("PieceFactory");
  const PrizeFactory = await ethers.getContractFactory("PrizeFactory");
  try {
    const pieceContract = await PieceFactory.deploy(
      "NearComm Puzzle Pieces",
      "NearCommPieces"
    );

    // await pieceContract.deployed();

    console.log(`PieceFactory deployed to: `, pieceContract.address);

    const prizeContract = await PrizeFactory.deploy(
      "NearComm Puzzle Prizes",
      "NearCommPrizes"
    );
    // await prizeContract.deployed();

    console.log(`PrizeFactory deployed to: `, prizeContract.address);

    const manager = await PuzzleManager.deploy(
      pieceContract.address,
      prizeContract.address
    );

    // await manager.deployed();

    console.log("PuzzleManager deployed on Aurora to: ", manager.address);

    const updatePiece = await pieceContract.updateManager(manager.address);
    await updatePiece.wait();
    console.log("Updated Piece");
    const updatePrize = await prizeContract.updateManager(manager.address);
    await updatePrize.wait();
    console.log("Updated Prize");
    const updatePackPurchase = await manager.setPackPurchaseStatusForGroup(
      "2",
      true
    );
    await updatePackPurchase.wait();
    console.log("Updated Pack Purchase");
    const setPackTierSize = await manager.setPackTierContentsSize("10", "0");

    await setPackTierSize.wait();
    console.log("Updated Pack Tier size");
    await run("verify:verify", {
      address: pieceContract.address,
      constructorArguments: ["NearComm Puzzle Pieces", "NearCommPieces"],
    });

    console.log("Verified PieceFactory contract on Aurora");

    await run("verify:verify", {
      address: prizeContract.address,
      constructorArguments: ["NearComm Puzzle Prizes", "NearCommPrizes"],
    });

    console.log("Verified PrizeFactory contract on Aurora");

    await run("verify:verify", {
      address: manager.address,
      constructorArguments: [pieceContract.address, prizeContract.address],
    });

    console.log("Verified PuzzleManager contract on Aurora");
  } catch (error) {
    console.error(error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main();
