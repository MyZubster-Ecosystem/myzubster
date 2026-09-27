import { defineConfig } from 'hardhat/config';
import hardhatEthers from '@nomicfoundation/hardhat-ethers';
export default defineConfig({
  plugins: [hardhatEthers],
  paths: { sources: './', artifacts: '../artifacts', cache: '../cache' },
  solidity: '0.8.28',
  networks: {
    base: { type: 'http', chainType: 'l1', url: 'https://mainnet.base.org', accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] },
    baseSepolia: { type: 'http', chainType: 'l1', url: 'https://sepolia.base.org', accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] }
  }
});
