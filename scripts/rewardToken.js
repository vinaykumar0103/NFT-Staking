const { ethers } = require("hardhat");

//Deploy RewardToken
async function main() {
    

    // Get the contract factory for RewardToken
    const RewardToken = await ethers.getContractFactory("RewardToken");

    // Deploy the contract
    const rewardToken = await RewardToken.deploy();
    
    // Wait for the deployment transaction to be mined
    await rewardToken.deployed();

    console.log(`RewardToken deployed to: ${rewardToken.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment script:", error);
        process.exit(1);
    });
