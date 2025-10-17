require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PulseTrackCore with account:", deployer.address);

  
  const aiMonitor = process.env.AI_MONITOR;
  const hederaLogger = process.env.HEDERA_LOGGER;
  const PYUSD_ADDRESS = process.env.PYUSD;

  if (!aiMonitor || !hederaLogger || !PYUSD_ADDRESS) {
    throw new Error("Please set AI_MONITOR, HEDERA_LOGGER, and PYUSD in .env");
  }

  
  const PulseTrack = await hre.ethers.getContractFactory("PulseTrackCore");
  const pulseTrack = await PulseTrack.deploy(PYUSD_ADDRESS);
  await pulseTrack.waitForDeployment();
  console.log("PulseTrackCore deployed at:", pulseTrack.target);

  
  await pulseTrack.setMonitors(aiMonitor, hederaLogger);
  console.log("AI Monitor address set to:", aiMonitor);
  console.log("Hedera Logger address set to:", hederaLogger);

  console.log("✅ Deployment finished successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
