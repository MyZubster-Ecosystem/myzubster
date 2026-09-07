// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMYZ is ERC20 {
    constructor() ERC20("Mock MYZ", "MYZ") {
        _mint(msg.sender, 1_000_000 ether);
    }
}
