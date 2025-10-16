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

    function setMonitors(address _ai , address _hedera) external onlyowner {};
    function pauseContract()external onlyOwner{};
    function unpauseContract()external onlyOwner{};

}