import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [owner] = await ethers.getSigners();

  console.log("Test owner:", owner.address);

  const Factory = await ethers.getContractFactory("MyZubsterComicNFT");
  const nft = await Factory.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("Contract:", address);
  console.log("Name:", await nft.name());
  console.log("Symbol:", await nft.symbol());

  const uri = "ipfs://TEST_METADATA_CID";
  const tx = await nft.mintComic(owner.address, uri);
  await tx.wait();

  console.log("Owner token #0:", await nft.ownerOf(0));
  console.log("URI token #0:", await nft.tokenURI(0));
  console.log("MYZUBSTER COMIC NFT LOCAL TEST: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
