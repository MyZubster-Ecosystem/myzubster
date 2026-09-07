const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function loadManifest() {
  const manifestPath = path.resolve(process.env.COMIC_MANIFEST || "build/comic-1155-metadata/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    throw new Error("Comic manifest has no items");
  }
  return { manifest, manifestPath };
}

function metadataURIs(manifest) {
  const base = String(process.env.METADATA_BASE_URI || "").replace(/\/$/, "");
  if (!base.startsWith("ipfs://")) throw new Error("METADATA_BASE_URI must be an ipfs:// URI");
  return manifest.items.map((item) => `${base}/${item.metadataFile}`);
}

async function main() {
  const { manifest, manifestPath } = loadManifest();
  const uris = metadataURIs(manifest);
  const amounts = manifest.items.map((item) => BigInt(item.amount || 1));
  const [signer] = await hre.ethers.getSigners();
  const recipient = process.env.NFT_RECIPIENT || signer.address;
  const contractAddress = process.env.COMIC_1155_CONTRACT;

  if (!contractAddress) throw new Error("COMIC_1155_CONTRACT is required");

  console.log("Network:", hre.network.name);
  console.log("Contract:", contractAddress);
  console.log("Signer:", signer.address);
  console.log("Recipient:", recipient);
  console.log("Manifest:", manifestPath);
  console.log("Items:", uris.length);

  const nft = await hre.ethers.getContractAt("MyZubsterComic1155", contractAddress);
  const estimatedGas = await nft.mintComicBatch.estimateGas(recipient, uris, amounts);
  console.log("Estimated gas:", estimatedGas.toString());

  if (process.env.CONFIRM_MINT !== "YES") {
    console.log("DRY RUN: no transaction sent. Set CONFIRM_MINT=YES only after reviewing this summary.");
    return;
  }

  const tx = await nft.mintComicBatch(recipient, uris, amounts);
  console.log("Transaction:", tx.hash);
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
