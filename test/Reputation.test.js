const { expect } = require("chai");

describe("ReputationSystem", function () {
    let reputation;
    let owner;
    let user1;
    let user2;
    
    beforeEach(async function () {
        const Reputation = await ethers.getContractFactory("ReputationSystem");
        reputation = await Reputation.deploy();
        await reputation.waitForDeployment();
        [owner, user1, user2] = await ethers.getSigners();
    });

    it("Should submit a review", async function () {
        await reputation.connect(user1).submitReview(user2.address, 5, "Great!");
        const [score, count] = await reputation.getReputation(user2.address);
        expect(count).to.equal(1);
        expect(score).to.equal(100);
    });
});
