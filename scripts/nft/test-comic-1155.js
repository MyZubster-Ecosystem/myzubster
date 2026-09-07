const assert = require("assert");
const hre = require("hardhat");

async function main() {
  const [owner, recipient, outsider] = await hre.ethers.getSigners();
  const Factory = await hre.ethers.getContractFactory("MyZubsterComic1155");
  const nft = await Factory.deploy();
  await nft.waitForDeployment();

  const uris = ["ipfs://metadata/001.json", "ipfs://metadata/002.json"];
  const amounts = [1, 2];
  await (await nft.mintComicBatch(recipient.address, uris, amounts)).wait();

  assert.equal((await nft.balanceOf(recipient.address, 1)).toString(), "1");
  assert.equal((await nft.balanceOf(recipient.address, 2)).toString(), "2");
  assert.equal(await nft.uri(1), uris[0]);
  assert.equal(await nft.uri(2), uris[1]);
  assert.equal((await nft.nextTokenId()).toString(), "3");

  await assert.rejects(
    nft.connect(outsider).mintComicBatch(outsider.address, ["ipfs://metadata/003.json"], [1]),
    /Ownable: caller is not the owner/,
  );
  await assert.rejects(
    nft.mintComicBatch(recipient.address, ["ipfs://metadata/003.json"], [1, 1]),
    /Comic: length mismatch/,
  );

  console.log("MYZUBSTER COMIC ERC-1155 LOCAL TEST: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
