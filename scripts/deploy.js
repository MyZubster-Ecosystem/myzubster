const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying MyZubster Token...");
    
    // Deploy del token
    const Token = await ethers.getContractFactory("MyZubsterToken");
    const token = await Token.deploy();
    await token.deployed();
    console.log("✅ MyZubster Token deployed to:", token.address);
    
    // Deploy del sistema di pagamento
    console.log("🚀 Deploying Native Payment System...");
    const Payment = await ethers.getContractFactory("NativePayment");
    const payment = await Payment.deploy();
    await payment.deployed();
    console.log("✅ Native Payment deployed to:", payment.address);
    
    // Whitelist del token nel sistema di pagamento
    console.log("🔐 Whitelisting token in payment system...");
    await payment.addWhitelistedToken(token.address);
    console.log("✅ Token whitelisted!");
    
    console.log("🎉 Deployment completed!");
    console.log(`📊 Token: ${token.address}`);
    console.log(`💳 Payment: ${payment.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
