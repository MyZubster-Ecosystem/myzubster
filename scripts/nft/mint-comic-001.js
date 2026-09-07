const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x89f20a2697bc2e7746b5FC8dD5229Fb54C00Bb03";
const METADATA_URI = "ipfs://QmRRQCJ5Lp9mxR3bG5FMZxj15CwSVw5oGRb1BFHs6UUSE3";

async function retry(fn, attempts = 20, delayMs = 1500) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const recipient = process.env.NFT_RECIPIENT || owner.address;

  console.log("Network:", hre.network.name);
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Recipient:", recipient);
  console.log("Metadata:", METADATA_URI);

  const nft = await hre.ethers.getContractAt("MyZubsterComicNFT", CONTRACT_ADDRESS);
  const tx = await nft.mintComic(recipient, METADATA_URI);

  console.log("Mint transaction:", tx.hash);
  const receipt = await tx.wait();
  console.log("Block:", receipt.blockNumber);

  const parsedEvents = receipt.logs
    .map((log) => {
      try {
        return nft.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const minted = parsedEvents.find((event) => event.name === "ComicMinted");
  if (!minted) throw new Error("ComicMinted event not found in receipt");

  const tokenId = minted.args.tokenId;
  const tokenOwner = await retry(() => nft.ownerOf(tokenId));
  const tokenURI = await retry(() => nft.tokenURI(tokenId));

  console.log("Comic minted");
  console.log("Token ID:", tokenId.toString());
  console.log("Owner:", tokenOwner);
  console.log("Token URI:", tokenURI);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
