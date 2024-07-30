const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeNFT", function () {
    let stakeNFT, rewardToken, erc721Mock;
    let owner, addr1;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
        const RewardToken = await ethers.getContractFactory("RewardToken");
        const StakeNFT = await ethers.getContractFactory("StakeNFT");

        erc721Mock = await ERC721Mock.deploy("MockNFT", "MNFT");
        await erc721Mock.deployed();

        rewardToken = await RewardToken.deploy();
        await rewardToken.deployed();

        stakeNFT = await StakeNFT.deploy();
        await stakeNFT.initialize(owner.address, erc721Mock.address, rewardToken.address);
        await stakeNFT.deployed();

    
        await erc721Mock.mint(addr1.address, 1);
        await rewardToken.mint(stakeNFT.address, ethers.utils.parseUnits("1000000", 18));
    });

    it("should allow staking an NFT", async function () {
        await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);
        await expect(stakeNFT.connect(addr1).stake(1))
            .to.emit(stakeNFT, "NFTStaked")
            .withArgs(addr1.address, 1);

        const stakeInfo = await stakeNFT.getStake(addr1.address, 1);
        expect(stakeInfo.stakedAt).to.be.gt(0);
        expect(stakeInfo.lastClaim).to.be.gt(0);
    });

    it("should prevent staking if staking is paused", async function () {
        await stakeNFT.pauseStaking();
        await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);
        await expect(stakeNFT.connect(addr1).stake(1)).to.be.revertedWith("Staking is paused");
    });

    it("should allow unstaking an NFT after the unbonding period", async function () {
        await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);
        await stakeNFT.connect(addr1).stake(1);

        const unstakePeriodBlocks = await stakeNFT.unstakePeriod();
        for (let i = 0; i < unstakePeriodBlocks.toNumber(); i++) {
            await ethers.provider.send("evm_mine");
        }

        await expect(stakeNFT.connect(addr1).unstake(1))
            .to.emit(stakeNFT, "NFTUnstaked")
            .withArgs(addr1.address, 1);

        const stakeInfo = await stakeNFT.getStake(addr1.address, 1);
        expect(stakeInfo.stakedAt).to.eq(0);
    });

it("should claim rewards correctly", async function () {
    
    await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);
    await stakeNFT.connect(addr1).stake(1);
    const rewardRatePerBlock = ethers.utils.parseEther("0.5");
    await stakeNFT.updateRewardRate(rewardRatePerBlock);
    const claimDelayBlocks = 10; 
    await stakeNFT.updateClaimDelay(claimDelayBlocks);
    for (let i = 0; i < claimDelayBlocks; i++) {
        await ethers.provider.send("evm_mine", []);
    }

    await rewardToken.mint(stakeNFT.address, rewardRatePerBlock.mul(claimDelayBlocks));
    await expect(stakeNFT.connect(addr1).claimRewards()).to.emit(stakeNFT, "RewardsClaimed");

    const balance = await rewardToken.balanceOf(addr1.address);
    expect(balance.gt(0)).to.be.true; 
});


it("should revert if claiming rewards before claim delay", async function () {
    await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);

    await stakeNFT.connect(addr1).stake(1);

    const claimDelay = 10;
    await stakeNFT.updateClaimDelay(claimDelay);
    await rewardToken.mint(stakeNFT.address, ethers.utils.parseEther("100"));
    const initialRewardBalance = await rewardToken.balanceOf(stakeNFT.address);
    expect(initialRewardBalance).to.be.gt(0);

    await ethers.provider.send("evm_increaseTime", [5]);
    await ethers.provider.send("evm_mine");
    await expect(stakeNFT.connect(addr1).claimRewards())
        .to.be.revertedWith("Claim delay not met");
});

 it("should pause and resume staking", async function () {
        await stakeNFT.connect(owner).pauseStaking();
        let isPaused = await stakeNFT.isStakingPaused();
        expect(isPaused).to.be.true;
        await erc721Mock.connect(addr1).approve(stakeNFT.address, 1);
        await expect(stakeNFT.connect(addr1).stake(1)).to.be.revertedWith("Staking is paused");
        await stakeNFT.connect(owner).resumeStaking();
        isPaused = await stakeNFT.isStakingPaused();
        expect(isPaused).to.be.false;

        await expect(stakeNFT.connect(addr1).stake(1))
            .to.emit(stakeNFT, "NFTStaked")
            .withArgs(addr1.address, 1);
    });


});
