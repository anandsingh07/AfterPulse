require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);


  const aiMonitor = process.env.AI_MONITOR;
  const hederaLogger = process.env.HEDERA_LOGGER;


  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const pyusd = await MockToken.deploy("PayPal USD", "PYUSD");
  await pyusd.waitForDeployment();
  console.log("MockToken deployed at:", pyusd.target);

  const PulseTrack = await hre.ethers.getContractFactory("PulseTrackCore");
  const pulseTrack = await PulseTrack.deploy(pyusd.target);
  await pulseTrack.waitForDeployment();
  console.log("PulseTrackCore deployed at:", pulseTrack.target);

  
  await pulseTrack.setMonitors(aiMonitor, hederaLogger);
  console.log("AI Monitor:", aiMonitor);
  console.log("Hedera Logger:", hederaLogger);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
