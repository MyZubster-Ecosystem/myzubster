const hre = require('hardhat');

async function main() {
  const maxSupply = Number(process.env.CHARACTER_NFT_MAX_SUPPLY || 10000);
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error('No deployer configured. Set EVM_DEPLOYER_PRIVATE_KEY.');
  }

  console.log('Deploying MyZubsterCharacter from:', deployer.address);
  console.log('Max supply:', maxSupply);

  const factory = await hre.ethers.getContractFactory('MyZubsterCharacter');
  const contract = await factory.deploy(maxSupply);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  console.log('CHAIN_ID=' + network.chainId.toString());
  console.log('MYZUBSTER_CHARACTER_CONTRACT=' + address);
  console.log('NFT_CONTRACT_ALLOWLIST_' + network.chainId.toString() + '=' + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
