require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PulseTrackCore with account:", deployer.address);

  const aiMonitor = process.env.AI_MONITOR;
  const PYUSD_ADDRESS = process.env.PYUSD;

  if (!aiMonitor || !PYUSD_ADDRESS) {
    throw new Error("Please set AI_MONITOR and PYUSD in .env");
  }

  const PulseTrack = await hre.ethers.getContractFactory("PulseTrackCore");
  const pulseTrack = await PulseTrack.deploy(PYUSD_ADDRESS);
  await pulseTrack.waitForDeployment();
  console.log("PulseTrackCore deployed at:", pulseTrack.target);

  await pulseTrack.setMonitors(aiMonitor);
  console.log("AI Monitor address set to:", aiMonitor);

  console.log("✅ Deployment finished successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
