const { ethers, upgrades, run } = require("hardhat");

//Deploy StakeNft
async function main() {

    const StakeNFT = await ethers.getContractFactory("StakeNFT");

    const initialOwner = '0x71252e5fDd7aE56FA390DfFe7B242D5651E061b0'; 
    const nftTokenAddress = '0xdBCEb9C3bAcD283935DDFdf8DC7673f476c99f06'; 
    const rewardTokenAddress = '0x7b76272B6baFfb709Cb80D4a3E5E65E2f818FB55';

    const stakeNFT = await upgrades.deployProxy(StakeNFT, [initialOwner, nftTokenAddress, rewardTokenAddress], { kind: 'uups' });
    await stakeNFT.deployed();
    
    console.log("StakeNFT deployed to:", stakeNFT.address);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(stakeNFT.address);
    console.log("Implementation deployed to:", implementationAddress);

    // Verify implementation contract
    await run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
    });
    console.log("Implementation contract verified");

    // Verify proxy contract
    await run("verify:verify", {
        address: stakeNFT.address,
        constructorArguments: [initialOwner, nftTokenAddress, rewardTokenAddress],
    });
    console.log("Proxy contract verified");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment script:", error.message);
        process.exit(1);
    });
