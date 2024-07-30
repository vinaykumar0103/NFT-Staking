require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");


module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_SEPOLIA}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    // polygon_amoy: {
    //   url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_POLYGON_AMOY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      // polygon: process.env.POLYGONSCAN_API_KEY,
    },
  }
};
