// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReputationSystem is Ownable, ReentrancyGuard {
    struct UserReputation {
        uint256 score;
        uint256 reviewsCount;
        uint256 positiveReviews;
        uint256 negativeReviews;
        mapping(address => bool) hasReviewed;
    }
    
    mapping(address => UserReputation) public reputations;
    
    event ReviewSubmitted(address indexed reviewer, address indexed target, uint256 rating, string review);
    event ReputationUpdated(address indexed user, uint256 newScore);
    
    function submitReview(address target, uint256 rating, string calldata review) external nonReentrant {
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(target != msg.sender, "Cannot review yourself");
        require(!reputations[target].hasReviewed[msg.sender], "Already reviewed");
        
        UserReputation storage rep = reputations[target];
        rep.hasReviewed[msg.sender] = true;
        rep.reviewsCount++;
        
        if (rating >= 4) {
            rep.positiveReviews++;
        } else {
            rep.negativeReviews++;
        }
        
        // Calcola il nuovo punteggio
        uint256 newScore = (rep.positiveReviews * 100) / rep.reviewsCount;
        rep.score = newScore;
        
        emit ReviewSubmitted(msg.sender, target, rating, review);
        emit ReputationUpdated(target, newScore);
    }
    
    function getReputation(address user) external view returns (uint256 score, uint256 reviewsCount) {
        UserReputation storage rep = reputations[user];
        return (rep.score, rep.reviewsCount);
    }
}
