const { expect } = require("chai");

describe("MyZubsterToken", function () {
    let token;
    let owner;
    let addr1;
    
    beforeEach(async function () {
        const Token = await ethers.getContractFactory("MyZubsterToken");
        token = await Token.deploy();
        [owner, addr1] = await ethers.getSigners();
    });

    it("Should deploy and have correct initial supply", async function () {
        const totalSupply = await token.totalSupply();
        // Usa BigInt per numeri grandi
        const expectedSupply = BigInt(1000000000) * BigInt(10) ** BigInt(18);
        expect(totalSupply).to.equal(expectedSupply);
    });
    
    it("Should allow minting by owner", async function () {
        await token.mint(addr1.address, 1000);
        const balance = await token.balanceOf(addr1.address);
        expect(balance).to.equal(1000);
    });
    
    it("Should have correct name and symbol", async function () {
        const name = await token.name();
        const symbol = await token.symbol();
        expect(name).to.equal("MyZubster Token");
        expect(symbol).to.equal("MYZ");
    });
});
