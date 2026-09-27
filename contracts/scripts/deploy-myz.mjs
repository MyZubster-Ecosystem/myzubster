import { network } from 'hardhat';
import { mkdir, writeFile } from 'node:fs/promises';

async function main() {
  const connection = await network.create();
  const { ethers } = connection;
  const Token = await ethers.getContractFactory('MyZubsterToken');
  const token = await Token.deploy();
  await token.waitForDeployment();
  const address = await token.getAddress();
  const totalSupply = await token.totalSupply();
  console.log('MyZubsterToken:', address);
  console.log('Total supply:', ethers.formatEther(totalSupply), 'MYZ');
  const filename = new URL(`../deployments/${connection.networkName}-MYZToken.json`, import.meta.url);
  await mkdir(new URL('../deployments/', import.meta.url), { recursive: true });
  await writeFile(filename, JSON.stringify({ address, chain: connection.networkName, totalSupply: ethers.formatEther(totalSupply), deployedAt: new Date().toISOString() }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
