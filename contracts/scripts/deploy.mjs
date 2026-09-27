import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.create();
  const Token = await ethers.getContractFactory('MyZubsterToken');
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  const Payment = await ethers.getContractFactory('NativePayment');
  const payment = await Payment.deploy();
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();
  const whitelist = await payment.addWhitelistedToken(tokenAddress);
  await whitelist.wait();
  console.log('MyZubsterToken:', tokenAddress);
  console.log('NativePayment:', paymentAddress);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
