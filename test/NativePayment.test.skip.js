const { expect } = require("chai");

describe("NativePayment", function () {
    let payment;
    let token;
    let owner;
    let addr1;
    let addr2;
    
    beforeEach(async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        this.owner = owner;
        this.addr1 = addr1;
        this.addr2 = addr2;
        
        // Deploy del token
        const Token = await ethers.getContractFactory("MyZubsterToken");
        token = await Token.deploy();
        await token.waitForDeployment();
        
        // Deploy del sistema di pagamento
        const Payment = await ethers.getContractFactory("NativePayment");
        payment = await Payment.deploy();
        await payment.waitForDeployment();
        
        // Whitelist del token
        await payment.addWhitelistedToken(await token.getAddress());
        
        // Mint token per i test (abbastanza per superare il minimo)
        const minPayment = await payment.MIN_PAYMENT();
        const amount = minPayment * BigInt(10); // 10 volte il minimo
        await token.mint(await addr1.getAddress(), amount * BigInt(2));
        await token.connect(addr1).approve(await payment.getAddress(), amount * BigInt(2));
    });

    it("Should process payment correctly", async function () {
        const minPayment = await payment.MIN_PAYMENT();
        const amount = minPayment * BigInt(5); // 5 volte il minimo
        
        await payment.connect(this.addr1).processPayment(
            await this.addr2.getAddress(), 
            amount, 
            await token.getAddress()
        );
        
        const balance = await token.balanceOf(await this.addr2.getAddress());
        const fee = (Number(amount) * 1) / 100;
        const expected = Number(amount) - fee;
        expect(Number(balance)).to.equal(expected);
    });
    
    it("Should whitelist token", async function () {
        const isWhitelisted = await payment.whitelistedTokens(await token.getAddress());
        expect(isWhitelisted).to.be.true;
    });
});
