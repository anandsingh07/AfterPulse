// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PulseTrackCore is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;


    struct Nominee { address wallet; uint256 share; }

    struct LockInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        bool active;
        bool zkpVerified;
        Nominee[] nominees;
        uint256 gracePeriod;
        uint256 lastActivity;
        address token; 
        uint256 inactivityPeriod;
    }

   
    mapping(address => LockInfo) public userLocks;
    mapping(address => uint256[]) public activityLog;
    mapping(address => uint256) public lastAIAction;
    mapping(address => uint256) public lastZKPVerified;

   
    address public aiMonitor;
    address public hederaLogger;
    address public immutable PYUSD;

    uint256 public aiCooldown = 1 hours;
    uint256 public zkpValidityPeriod = 30 days;

    
    event Locked(address indexed user, uint256 amount, uint256 period);
    event Unlocked(address indexed user, uint256 amount);
    event ActivityVerified(address indexed user, uint256 timestamp);
    event InactivityTransfer(address indexed user, address indexed nominee, uint256 amount);
    event HederaLog(address indexed user, string logType, uint256 timestamp);
    event Ping(address indexed user, uint256 timestamp);


    modifier onlyAI() {
        require(msg.sender == aiMonitor, "Not AI monitor");
        _;
    }

 constructor(address _pyusd) Ownable(msg.sender) {
    PYUSD = _pyusd;
}


    
    function setMonitors(address _ai, address _hedera) external onlyOwner {
        aiMonitor = _ai;
        hederaLogger = _hedera;
    }

   
    function pauseContract() external onlyOwner { _pause(); }
    function unpauseContract() external onlyOwner { _unpause(); }

    
    function lockETH(
        uint256 _lockPeriod,
        Nominee[] calldata _nominees,
        uint256 _graceDays,
        uint256 _inactivityPeriod
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "No ETH sent");
        require(_inactivityPeriod >= 1 days, "Inactivity too short");

        _lock(msg.value, _lockPeriod, _nominees, _graceDays, _inactivityPeriod, address(0));
    }

    function lockPYUSD(
        uint256 _amount,
        uint256 _lockPeriod,
        Nominee[] calldata _nominees,
        uint256 _graceDays,
        uint256 _inactivityPeriod
    ) external nonReentrant whenNotPaused {
        require(_amount > 0, "Zero amount");
        require(_inactivityPeriod >= 1 days, "Inactivity too short");

        IERC20(PYUSD).safeTransferFrom(msg.sender, address(this), _amount);
        _lock(_amount, _lockPeriod, _nominees, _graceDays, _inactivityPeriod, PYUSD);
    }

   
    function _lock(
        uint256 _amount,
        uint256 _lockPeriod,
        Nominee[] calldata _nominees,
        uint256 _graceDays,
        uint256 _inactivityPeriod,
        address _token
    ) internal {
        LockInfo storage info = userLocks[msg.sender];
        require(!info.active, "Already locked");
        require(_lockPeriod >= 1 days, "Lock too short");
        require(_nominees.length > 0, "No nominees");

        uint256 totalShare;
        delete info.nominees;

        for (uint256 i = 0; i < _nominees.length; i++) {
            require(_nominees[i].wallet != address(0), "Bad nominee");
            totalShare += _nominees[i].share;
            info.nominees.push(_nominees[i]);
        }
        require(totalShare == 100, "Share != 100");

        info.amount = _amount;
        info.startTime = block.timestamp;
        info.lockPeriod = _lockPeriod;
        info.gracePeriod = _graceDays * 1 days;
        info.inactivityPeriod = _inactivityPeriod;
        info.lastActivity = block.timestamp;
        info.token = _token;
        info.active = true;

        emit Locked(msg.sender, _amount, _lockPeriod);
        emit HederaLog(msg.sender, _token == address(0) ? "LOCK_CREATED_ETH" : "LOCK_CREATED_PYUSD", block.timestamp);
    }

    function ping() external whenNotPaused {
        LockInfo storage info = userLocks[msg.sender];
        require(info.active, "No active lock");

        info.lastActivity = block.timestamp;
        activityLog[msg.sender].push(block.timestamp);

        emit Ping(msg.sender, block.timestamp);
        emit HederaLog(msg.sender, "PING", block.timestamp);
    }

    function verifyActivity(address user, bytes calldata zkpProof) external onlyAI whenNotPaused {
        require(userLocks[user].active, "Inactive user");
        require(block.timestamp > lastAIAction[user] + aiCooldown, "AI cooldown");
        require(zkpProof.length > 0, "No ZKP provided");

        LockInfo storage info = userLocks[user];
        info.zkpVerified = true;
        info.lastActivity = block.timestamp;

        lastAIAction[user] = block.timestamp;
        lastZKPVerified[user] = block.timestamp;
        activityLog[user].push(block.timestamp);

        emit ActivityVerified(user, block.timestamp);
        emit HederaLog(user, "ACTIVITY_VERIFIED", block.timestamp);
    }

  
    function triggerInactivityTransfer(address user) external onlyAI nonReentrant whenNotPaused {
        LockInfo storage info = userLocks[user];
        require(info.active, "No active lock");
        require(block.timestamp > info.lastActivity + info.inactivityPeriod, "User still active");

        uint256 total = info.amount;
        info.active = false;
        info.amount = 0;

        for (uint256 i = 0; i < info.nominees.length; i++) {
            uint256 shareAmt = (total * info.nominees[i].share) / 100;

            if (info.token == address(0)) {
                (bool ok, ) = info.nominees[i].wallet.call{value: shareAmt}("");
                require(ok, "ETH transfer failed");
            } else {
                IERC20(info.token).safeTransfer(info.nominees[i].wallet, shareAmt);
            }

            emit InactivityTransfer(user, info.nominees[i].wallet, shareAmt);
        }

        emit HederaLog(user, "INACTIVITY_TRANSFER", block.timestamp);
    }


    function withdraw() external nonReentrant whenNotPaused {
        LockInfo storage info = userLocks[msg.sender];
        require(info.active, "No active lock");
        require(block.timestamp >= info.startTime + info.lockPeriod, "Still locked");

        uint256 amount = info.amount;
        info.active = false;
        info.amount = 0;

        if (info.token == address(0)) {
            (bool ok, ) = payable(msg.sender).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(info.token).safeTransfer(msg.sender, amount);
        }

        emit Unlocked(msg.sender, amount);
        emit HederaLog(msg.sender, "USER_WITHDRAW", block.timestamp);
    }

    function getActivityLog(address user) external view returns (uint256[] memory) {
        return activityLog[user];
    }

    function isZKPValid(address user) external view returns (bool) {
        return block.timestamp <= lastZKPVerified[user] + zkpValidityPeriod;
    }

    receive() external payable {
        revert("Direct ETH not allowed");
    }
}
