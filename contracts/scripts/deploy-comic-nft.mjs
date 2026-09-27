import { network } from "hardhat";
let ethers;

async function waitForCode(address, attempts = 20, delayMs = 1500) {
  for (let i = 0; i < attempts; i += 1) {
    const code = await ethers.provider.getCode(address);
    if (code && code !== "0x") return code;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`No bytecode visible at ${address} after waiting for RPC propagation`);
}

async function main() {
  const connection = await network.create();
  ethers = connection.ethers;
  const [deployer] = await ethers.getSigners();

  console.log("Network:", connection.networkName);
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("MyZubsterComicNFT");
  const nft = await Factory.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("MyZubsterComicNFT:", address);

  await waitForCode(address);

  console.log("Name:", await nft.name());
  console.log("Symbol:", await nft.symbol());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
