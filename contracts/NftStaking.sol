// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


// Imports Openzeppelin Librarys
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";


contract StakeNFT is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    struct Stake {
        uint256 stakedAt; // Block number when NFT was staked
        uint256 lastClaim; // Last block when rewards were claimed
    }

    // State variables
    IERC721 public nftToken;
    IERC20 public rewardToken;

    // Public variables
    uint256 public rewardRatePerBlock; // Reward tokens per block
    uint256 public unstakePeriod; // Unbonding period (in blocks)
    uint256 public claimDelay; // Delay before claiming rewards (in blocks)
    uint256 public totalRewardCap; // Maximum total reward tokens
    uint256 public unstakePeriodDays; // Unbonding period in days
    uint256 public claimDelayDays; // Delay before claiming rewards in days
    bool public isStakingPaused; // Pause flag for staking

    // Constants
    uint256 public constant SECONDS_PER_BLOCK = 15;

    // Mappings
    mapping(address => mapping(uint256 => Stake)) private stakes;
    mapping(address => uint256[]) private userNFTs;

    // Events
    event NFTStaked(address indexed user, uint256 indexed tokenId);
    event NFTUnstaked(address indexed user, uint256 indexed tokenId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event StakingPaused();
    event StakingResumed();
    event RewardRateUpdated(uint256 newRate);
    event UnstakePeriodUpdated(uint256 newPeriod);
    event ClaimDelayUpdated(uint256 newDelay);
    event TotalRewardCapUpdated(uint256 newCap);
    event UnstakePeriodDaysUpdated(uint256 newPeriodDays);
    event ClaimDelayDaysUpdated(uint256 newDelayDays);

    // Initializer function
    function initialize(
        address initialOwner,
        address _nftToken,
        address _rewardToken
    ) external initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        nftToken = IERC721(_nftToken);
        rewardToken = IERC20(_rewardToken);
        
        unstakePeriodDays = 7; // 7 days
        claimDelayDays = 5; // 5 days
        unstakePeriod = unstakePeriodDays * 24 * 60 * 60 / SECONDS_PER_BLOCK; // Convert days to blocks
        claimDelay = claimDelayDays * 24 * 60 * 60 / SECONDS_PER_BLOCK; // Convert days to blocks
        
        isStakingPaused = false;
        totalRewardCap = 1000000 * 10**18; // Total reward tokens cap (1 million)

        // Transfer ownership to the initial owner
        transferOwnership(initialOwner);
    }

    // Modifier to ensure staking is not paused
    modifier resume() {
        require(!isStakingPaused, "Staking is paused");
        _;
    }

    // Stake an NFT
    function stake(uint256 tokenId) external resume nonReentrant {
        require(nftToken.ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        nftToken.transferFrom(msg.sender, address(this), tokenId);
        stakes[msg.sender][tokenId] = Stake(block.number, block.number);
        userNFTs[msg.sender].push(tokenId);

        emit NFTStaked(msg.sender, tokenId);
    }

    // Unstake an NFT
    function unstake(uint256 tokenId) external nonReentrant {
        Stake storage stakeInfo = stakes[msg.sender][tokenId];
        require(stakeInfo.stakedAt != 0, "NFT not staked");
        require(block.number >= stakeInfo.stakedAt + unstakePeriod, "Unbonding period not completed");

        delete stakes[msg.sender][tokenId];
        _removeNFT(msg.sender, tokenId);
        nftToken.transferFrom(address(this), msg.sender, tokenId);

        emit NFTUnstaked(msg.sender, tokenId);
    }

    // Claim rewards
    function claimRewards() external nonReentrant {
        uint256 totalReward = _calculateRewards(msg.sender);
        require(totalReward > 0, "No rewards to claim");

        uint256 lastClaim = stakes[msg.sender][userNFTs[msg.sender][0]].lastClaim;
        require(block.number >= lastClaim + claimDelay, "Claim delay not met");

        // Ensure the total reward distributed does not exceed the cap
        require(rewardToken.balanceOf(address(this)) >= totalReward, "Insufficient reward tokens");
        require(totalReward <= totalRewardCap, "Reward cap exceeded");

        stakes[msg.sender][userNFTs[msg.sender][0]].lastClaim = block.number;
        rewardToken.transfer(msg.sender, totalReward);

        emit RewardsClaimed(msg.sender, totalReward);
    }


    // Remove NFT from user's list
    function _removeNFT(address user, uint256 tokenId) internal {
        uint256[] storage nftList = userNFTs[user];
        uint256 length = nftList.length;
        for (uint256 i = 0; i < length; i++) {
            if (nftList[i] == tokenId) {
                nftList[i] = nftList[length - 1];
                nftList.pop();
                break;
            }
        }
    }

    // Update reward rate
    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerBlock = newRate;
        emit RewardRateUpdated(newRate);
    }

    // Update unbonding period in blocks
    function updateUnstakePeriod(uint256 newPeriod) external onlyOwner {
        unstakePeriod = newPeriod;
        emit UnstakePeriodUpdated(newPeriod);
    }

    // Update claim delay in blocks
    function updateClaimDelay(uint256 newDelay) external onlyOwner {
        claimDelay = newDelay;
        emit ClaimDelayUpdated(newDelay);
    }

    // Update total reward cap
    function updateTotalRewardCap(uint256 newCap) external onlyOwner {
        totalRewardCap = newCap;
        emit TotalRewardCapUpdated(newCap);
    }

    // Update unstake period in days
    function updateUnstakePeriodDays(uint256 newPeriodDays) external onlyOwner {
        unstakePeriodDays = newPeriodDays;
        unstakePeriod = unstakePeriodDays * 24 * 60 * 60 / SECONDS_PER_BLOCK; // Convert days to blocks
        emit UnstakePeriodDaysUpdated(newPeriodDays);
    }

    // Update claim delay in days
    function updateClaimDelayDays(uint256 newDelayDays) external onlyOwner {
        claimDelayDays = newDelayDays;
        claimDelay = claimDelayDays * 24 * 60 * 60 / SECONDS_PER_BLOCK; // Convert days to blocks
        emit ClaimDelayDaysUpdated(newDelayDays);
    }

    // Pause staking
    function pauseStaking() external onlyOwner {
        isStakingPaused = true;
        emit StakingPaused();
    }

    // Unpause staking
    function resumeStaking() external onlyOwner {
        isStakingPaused = false;
        emit StakingResumed();
    }


      
   // Get Stake
    function getStake(address user, uint256 tokenId) external view returns (Stake memory) {
    return stakes[user][tokenId];
    }

    // Internal function to calculate rewards
    function _calculateRewards(address user) internal view returns (uint256) {
    uint256 totalReward = 0;
    uint256[] storage userStakes = userNFTs[user];
    uint256 currentBlock = block.number;
    
    for (uint256 i = 0; i < userStakes.length; i++) {
        uint256 tokenId = userStakes[i];
        Stake storage stakeInfo = stakes[user][tokenId];
        if (stakeInfo.stakedAt > 0) {
            uint256 blocksStaked = currentBlock - stakeInfo.stakedAt;
            totalReward += blocksStaked * rewardRatePerBlock;
        }
    }
    
    return totalReward;
}

    // Override for upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
