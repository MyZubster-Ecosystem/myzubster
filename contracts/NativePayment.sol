// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NativePayment is Ownable, ReentrancyGuard {
    mapping(address => uint256) public balances;
    mapping(address => bool) public whitelistedTokens;
    mapping(address => mapping(address => uint256)) public userBalances;
    
    event PaymentProcessed(address indexed from, address indexed to, uint256 amount, address token);
    event TokenWhitelisted(address indexed token, bool status);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    uint256 public constant MIN_PAYMENT = 0.001 ether;
    uint256 public constant MAX_PAYMENT = 1000 ether;
    uint256 public feePercentage = 1;
    
    function processPayment(address to, uint256 amount, address token) external nonReentrant {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(amount >= MIN_PAYMENT, "Amount below minimum");
        require(amount <= MAX_PAYMENT, "Amount above maximum");
        require(to != address(0), "Invalid recipient");
        
        IERC20 paymentToken = IERC20(token);
        uint256 fee = (amount * feePercentage) / 100;
        uint256 amountAfterFee = amount - fee;
        
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(paymentToken.transfer(to, amountAfterFee), "Transfer to recipient failed");
        
        userBalances[msg.sender][token] += amount;
        
        emit PaymentProcessed(msg.sender, to, amount, token);
    }
    
    function addWhitelistedToken(address token) external onlyOwner {
        whitelistedTokens[token] = true;
        emit TokenWhitelisted(token, true);
    }
    
    function removeWhitelistedToken(address token) external onlyOwner {
        whitelistedTokens[token] = false;
        emit TokenWhitelisted(token, false);
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    function getUserTokenBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
}
