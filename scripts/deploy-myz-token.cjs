const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error('No deployer configured. Set EVM_DEPLOYER_PRIVATE_KEY.');
  }

  console.log('Deploying MyZubsterToken from:', deployer.address);

  const factory = await hre.ethers.getContractFactory('MyZubsterToken');
  const token = await factory.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  const network = await hre.ethers.provider.getNetwork();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();

  console.log('CHAIN_ID=' + network.chainId.toString());
  console.log('MYZ_TOKEN_ADDRESS_' + network.chainId.toString() + '=' + address);
  console.log('MYZ_DECIMALS=' + decimals.toString());
  console.log('MYZ_TOTAL_SUPPLY=' + totalSupply.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
