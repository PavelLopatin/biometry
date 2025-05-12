require("@nomicfoundation/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require('@tenderly/hardhat-tenderly');
require('hardhat-log-remover');

require('dotenv').config({path:__dirname+'/.env'})
const { PRIVATE_KEY, RPC_URL, CHAIN_ID } = process.env
const INT_CHAIN_ID = parseInt(CHAIN_ID)


module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  defaultNetwork: "default",
  networks: {
    hardhat: {},
    default: {
      url: RPC_URL,
      chainId: INT_CHAIN_ID,
      accounts: [ PRIVATE_KEY] 
    },
  }
};


