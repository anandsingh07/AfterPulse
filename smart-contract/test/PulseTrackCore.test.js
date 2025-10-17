const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PulseTrackCore Full Tests", function () {
  let PulseTrack, pulseTrack;
  let MockToken, pyusd;
  let owner, user1, user2, aiMonitor, nominee;

  const ONE_DAY = 24 * 60 * 60; // 1 day in seconds
  const LOCK_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2, aiMonitor, nominee] = await ethers.getSigners();

    // Deploy Mock PYUSD
    MockToken = await ethers.getContractFactory("MockToken");
    pyusd = await MockToken.deploy("PYUSD Token", "PYUSD");
    await pyusd.waitForDeployment?.(); // optional for ethers v6

    // Deploy PulseTrackCore
    PulseTrack = await ethers.getContractFactory("PulseTrackCore");
    pulseTrack = await PulseTrack.deploy(pyusd.target);
    await pulseTrack.waitForDeployment?.();

    // Set monitors
    await pulseTrack.connect(owner).setMonitors(aiMonitor.address, owner.address);

    // Mint PYUSD to user1
    await pyusd.mint(user1.address, LOCK_AMOUNT);
  });

  it("Should lock ETH and update activity", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];

    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT });

    const lock = await pulseTrack.userLocks(user1.address);
    expect(lock.amount).to.equal(LOCK_AMOUNT);
    expect(lock.active).to.be.true;

    // Ping to update activity
    await pulseTrack.connect(user1).ping();
    const activity = await pulseTrack.getActivityLog(user1.address);
    expect(activity.length).to.equal(1);
  });

  it("Should lock PYUSD correctly", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];

    await pyusd.connect(user1).approve(pulseTrack.target, LOCK_AMOUNT);

    await pulseTrack.connect(user1).lockPYUSD(LOCK_AMOUNT, ONE_DAY, nominees, 1, ONE_DAY);

    const lock = await pulseTrack.userLocks(user1.address);
    expect(lock.amount).to.equal(LOCK_AMOUNT);
    expect(lock.token).to.equal(pyusd.target);
  });

  it("Should verify activity via AI monitor", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];
    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT });

    // Simulate ZKP proof as bytes
    const zkpProof = ethers.toBeHex("0x01");

    await pulseTrack.connect(aiMonitor).verifyActivity(user1.address, zkpProof);

    const lock = await pulseTrack.userLocks(user1.address);
    expect(lock.zkpVerified).to.be.true;
  });

  it("Should withdraw after lock period", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];
    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 0, ONE_DAY, { value: LOCK_AMOUNT });

    // Increase time past lock period
    await ethers.provider.send("evm_increaseTime", [ONE_DAY + 10]);
    await ethers.provider.send("evm_mine");

    await pulseTrack.connect(user1).withdraw();

    const lock = await pulseTrack.userLocks(user1.address);
    expect(lock.active).to.be.false;
    expect(lock.amount).to.equal(0);
  });

  it("Should transfer to nominees after inactivity", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];
    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT });

    // Increase time past inactivity period
    await ethers.provider.send("evm_increaseTime", [ONE_DAY + 10]);
    await ethers.provider.send("evm_mine");

    await pulseTrack.connect(aiMonitor).triggerInactivityTransfer(user1.address);

    const lock = await pulseTrack.userLocks(user1.address);
    expect(lock.active).to.be.false;
  });

  it("Should revert if nominee shares != 100", async function () {
    const nominees = [{ wallet: nominee.address, share: 50 }];

    await expect(
      pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT })
    ).to.be.revertedWith("Share != 100");
  });

  it("Should revert if non-AI tries to verify activity", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];
    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT });

    const zkpProof = ethers.toBeHex("0x01");

    await expect(
      pulseTrack.connect(user2).verifyActivity(user1.address, zkpProof)
    ).to.be.revertedWith("Not AI monitor");
  });

  it("Should revert if withdraw called too early", async function () {
    const nominees = [{ wallet: nominee.address, share: 100 }];
    await pulseTrack.connect(user1).lockETH(ONE_DAY, nominees, 1, ONE_DAY, { value: LOCK_AMOUNT });

    await expect(pulseTrack.connect(user1).withdraw()).to.be.revertedWith("Still locked");
  });
});
