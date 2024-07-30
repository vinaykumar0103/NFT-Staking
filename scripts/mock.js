// scripts/deploy_mock_nft.js

const { ethers } = require("hardhat");

async function main() {

    // Get the contract factory 
    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");

    // Constructor parameters
    const name = "MockNFT";
    const symbol = "MNFT";

    // Deploy the contract with the constructor parameters
    const erc721Mock = await ERC721Mock.deploy(name, symbol);
    
    // Wait for the deployment transaction to be mined
    await erc721Mock.deployed();

    console.log(`ERC721Mock deployed to: ${erc721Mock.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment script:", error);
        process.exit(1);
    });
