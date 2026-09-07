const { expect } = require('chai');
const hre = require('hardhat');

const { ethers } = hre;

async function deployFixture() {
  const [owner, seller, buyer] = await ethers.getSigners();

  const Token = await ethers.getContractFactory('MockMYZ');
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Character = await ethers.getContractFactory('MyZubsterCharacter');
  const character = await Character.deploy(10000);
  await character.waitForDeployment();

  const Escrow = await ethers.getContractFactory('MyZubsterMarketplaceEscrow');
  const escrow = await Escrow.deploy(await token.getAddress());
  await escrow.waitForDeployment();

  await (await token.transfer(buyer.address, ethers.parseUnits('100', 18))).wait();
  await (await character.connect(seller).mintCharacter('ipfs://character-1')).wait();

  return { owner, seller, buyer, token, character, escrow };
}

describe('MyZubster NFT contract core', function () {
  it('allows only one Character NFT per wallet', async function () {
    const { seller, character } = await deployFixture();

    await expect(
      character.connect(seller).mintCharacter('ipfs://character-2')
    ).to.be.revertedWith('character already minted');
  });

  it('settles MYZ payment and NFT delivery atomically', async function () {
    const { seller, buyer, token, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();
    const price = ethers.parseUnits('10', 18);

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(await character.getAddress(), 1, price)).wait();
    await (await token.connect(buyer).approve(escrowAddress, price)).wait();

    const sellerBefore = await token.balanceOf(seller.address);
    const buyerBefore = await token.balanceOf(buyer.address);

    await (await escrow.connect(buyer).buy(1)).wait();

    expect(await character.ownerOf(1)).to.equal(buyer.address);
    expect(await token.balanceOf(seller.address)).to.equal(sellerBefore + price);
    expect(await token.balanceOf(buyer.address)).to.equal(buyerBefore - price);
    expect((await escrow.listings(1)).active).to.equal(false);
  });

  it('reverts the entire purchase when MYZ allowance is missing', async function () {
    const { seller, buyer, token, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();
    const price = ethers.parseUnits('10', 18);

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(await character.getAddress(), 1, price)).wait();

    await expect(escrow.connect(buyer).buy(1)).to.be.reverted;
    expect(await character.ownerOf(1)).to.equal(escrowAddress);
    expect(await token.balanceOf(seller.address)).to.equal(0n);
    expect((await escrow.listings(1)).active).to.equal(true);
  });

  it('returns the NFT to the seller on cancellation', async function () {
    const { seller, character, escrow } = await deployFixture();
    const escrowAddress = await escrow.getAddress();

    await (await character.connect(seller).approve(escrowAddress, 1)).wait();
    await (await escrow.connect(seller).list(await character.getAddress(), 1, ethers.parseUnits('10', 18))).wait();
    await (await escrow.connect(seller).cancel(1)).wait();

    expect(await character.ownerOf(1)).to.equal(seller.address);
    expect((await escrow.listings(1)).active).to.equal(false);
  });
});
