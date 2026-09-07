const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "POL");

  if (process.env.CONFIRM_DEPLOY !== "YES" && hre.network.name !== "hardhat") {
    throw new Error("Deployment blocked. Set CONFIRM_DEPLOY=YES after reviewing network, wallet, and gas.");
  }

  const Factory = await hre.ethers.getContractFactory("MyZubsterComic1155");
  const nft = await Factory.deploy();
  await nft.waitForDeployment();
  console.log("MyZubsterComic1155:", await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
