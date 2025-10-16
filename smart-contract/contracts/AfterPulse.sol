// SPDX-License-Identifier:MIT 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract PulseTrackcore is ReentrancyGuard , Ownable , Pausable {
    using SafeERC20 for IERC20 ;

    struct Nominee {

        address wallet ;
        uint256 share ;
    }
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

}