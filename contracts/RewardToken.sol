// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


// In a Comments i used for testing purpose 

contract RewardToken is ERC20 {
    // address private _owner;

    constructor() ERC20("Reward", "RT") {
        // _owner = msg.sender;
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    // modifier onlyOwner() {
    //     require(msg.sender == _owner, "Not the owner");
    //     _;
    // }

    // function mint(address to, uint256 amount) external onlyOwner {
    //     _mint(to, amount);
    // }
}
