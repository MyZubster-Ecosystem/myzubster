const { expect } = require('chai');
const hre = require('hardhat');

const { ethers } = hre;

async function deployFixture() {
  const [owner, seller, buyer] = await ethers.getSigners();

  const Token = await ethers.getContractFactory('MyZubsterToken');
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Character = await ethers.getContractFactory('MyZubsterCharacter');
  const character = await Character.deploy(10000);
  await character.waitForDeployment();

  const Escrow = await ethers.getContractFactory('MyZubsterMarketplaceEscrow');
  const escrow = await Escrow.deploy(await token.getAddress());
  await escrow.waitForDeployment();

  await (await token.transfer(buyer.address, ethers.parseUnits('100', 18))).wait();
  await (await character.connect(seller).mintCharacter('data:application/json;base64,e30=')).wait();

  return { owner, seller, buyer, token, character, escrow };
}

describe('MyZubsterMarketplaceEscrow', function () {
  it('settles MYZ payment and NFT delivery atomically', async function () {
    const { seller, buyer, token, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(
      await character.getAddress(),
      1,
      ethers.parseUnits('10', 18)
    )).wait();

    expect(await character.ownerOf(1)).to.equal(escrowAddress);

    await (await token.connect(buyer).approve(escrowAddress, ethers.parseUnits('10', 18))).wait();

    const sellerBefore = await token.balanceOf(seller.address);
    const buyerBefore = await token.balanceOf(buyer.address);

    await (await escrow.connect(buyer).buy(1)).wait();

    expect(await character.ownerOf(1)).to.equal(buyer.address);
    expect(await token.balanceOf(seller.address)).to.equal(sellerBefore + ethers.parseUnits('10', 18));
    expect(await token.balanceOf(buyer.address)).to.equal(buyerBefore - ethers.parseUnits('10', 18));

    const listing = await escrow.listings(1);
    expect(listing.active).to.equal(false);
  });

  it('returns the NFT when the seller cancels', async function () {
    const { seller, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(
      await character.getAddress(),
      1,
      ethers.parseUnits('10', 18)
    )).wait();

    await (await escrow.connect(seller).cancel(1)).wait();

    expect(await character.ownerOf(1)).to.equal(seller.address);
    const listing = await escrow.listings(1);
    expect(listing.active).to.equal(false);
  });

  it('cannot charge a buyer without enough MYZ allowance', async function () {
    const { seller, buyer, token, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(
      await character.getAddress(),
      1,
      ethers.parseUnits('10', 18)
    )).wait();

    let failed = false;
    try {
      await (await escrow.connect(buyer).buy(1)).wait();
    } catch {
      failed = true;
    }

    expect(failed).to.equal(true);
    expect(await character.ownerOf(1)).to.equal(escrowAddress);
    expect(await token.balanceOf(seller.address)).to.equal(0n);
    const listing = await escrow.listings(1);
    expect(listing.active).to.equal(true);
  });
});
