const { ethers, upgrades } = require("hardhat");

async function main() {
    // Address of the existing proxy
    const proxyAddress = "0x895B740A8c1772bC261b49F92701B397D1991216";

    
    const StakeNFT = await ethers.getContractFactory("StakeNFT");

    console.log("Upgrading the proxy to the new implementation...");

    try {
        // Upgrade the proxy to the new implementation
        const stakeNFT = await upgrades.upgradeProxy(proxyAddress, StakeNFT);
        await stakeNFT.deployed();
        console.log("StakeNFT proxy upgraded to the new implementation:", stakeNFT.address);

        // Optionally, log the new implementation address
        const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(stakeNFT.address);
        console.log("New implementation address:", newImplementationAddress);
    } catch (error) {
        console.error("Upgrade failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script execution failed:", error.message);
        process.exit(1);
    });
