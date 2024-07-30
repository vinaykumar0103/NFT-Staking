                        DZap NFT Staking Task Documentation


#
Introduction

The DZap NFT staking system is designed to facilitate the staking of ERC721 NFTs and reward users with ERC20 tokens. The system comprises two main contracts: the NFT Staking Contract and the RewardToken Contract. To ensure flexibility and upgradability, the system employs the Universal Upgradeable Proxy Standard (UUPS).

#
Setup Instructions
Clone the Repository: git clone https://github.com/your-repo/stake-nft.git

#
Install Dependencies 
npm install

#
Compile Contracts
npx hardhat compile

#
Deployment 
1. Deploy RewardToken:
Deploy the RewardToken contract, which is essential for the staking system:

-npx hardhat run scripts/rewardToken.js --network <sepolia>
After deployment, verify the contract address


2. Deploy StakeNFT:
With the RewardToken contract deployed, deploy the StakeNFT contract:

-npx hardhat run scripts/nftStaking.js --network <sepolia>

This script deploys the StakeNFT contract as an upgradeable proxy and provides the proxy address. Verify the proxy and implementation addresses 

3. Deploy upgradeStakeNft:
-npx hardhat run scripts/upgradeStakeNft.js --network <sepolia>

using proxy address

<!-- 4. Deploy Mock script for testing purpose only -->


#
Test cases:

All functions run the test suite using Hardhat and Chai and MockNft contract use for testing purpose.
Npx hardhat test