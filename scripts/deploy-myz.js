const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying MYZToken on Base Sepolia...");

  // Deploy del contratto
  const MYZToken = await hre.ethers.getContractFactory("MYZToken");
  const myzToken = await MYZToken.deploy();

  await myzToken.waitForDeployment();

  const address = await myzToken.getAddress();
  console.log(`✅ MYZToken deployed to: ${address}`);

  // Verifica il total supply
  const totalSupply = await myzToken.totalSupply();
  console.log(`📊 Total Supply: ${ethers.formatEther(totalSupply)} MYZ`);
  console.log(`💱 1 MYZ = 1€ (fisso)`);
  console.log(`💰 Value: ${ethers.formatEther(totalSupply)}€`);

  // Salva l'indirizzo
  const data = {
    address: address,
    chain: hre.network.name,
    totalSupply: ethers.formatEther(totalSupply),
    price: "1 MYZ = 1€",
    deployedAt: new Date().toISOString()
  };
  
  // Crea la directory se non esiste
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  
  fs.writeFileSync(
    `./deployments/${hre.network.name}-MYZToken.json`,
    JSON.stringify(data, null, 2)
  );

  console.log(`📝 Deployment info saved to deployments/${hre.network.name}-MYZToken.json`);
  
  // Verifica il contratto su Basescan
  console.log(`🔍 Verify on Basescan: https://sepolia.basescan.org/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
