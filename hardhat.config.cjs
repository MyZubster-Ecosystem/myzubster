require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();

const accounts = process.env.EVM_DEPLOYER_PRIVATE_KEY
  ? [process.env.EVM_DEPLOYER_PRIVATE_KEY]
  : [];

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    sepolia: {
      url: process.env.EVM_RPC_URL_11155111 || '',
      accounts
    }
  }
};
