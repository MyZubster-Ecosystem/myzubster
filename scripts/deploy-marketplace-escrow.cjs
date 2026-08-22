const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  const paymentToken = process.env[`MYZ_TOKEN_ADDRESS_${chainId}`];
  if (!paymentToken) {
    throw new Error(`Missing MYZ_TOKEN_ADDRESS_${chainId}`);
  }

  console.log('Deploying MyZubsterMarketplaceEscrow from:', deployer.address);
  console.log('MYZ token:', paymentToken);

  const Factory = await hre.ethers.getContractFactory('MyZubsterMarketplaceEscrow');
  const escrow = await Factory.deploy(paymentToken);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`CHAIN_ID=${chainId}`);
  console.log(`MYZ_MARKETPLACE_ESCROW_ADDRESS_${chainId}=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
