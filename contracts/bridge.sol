// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BridgeContract
 * @dev Bridge contract for managing stablecoin deposits
 * @notice This contract allows users to deposit approved stablecoins
 */
contract BridgeContract {
    using SafeERC20 for IERC20;
    address public owner;

    // Mapping to track acceptable tokens (onedollar as requested)
    mapping(address => bool) public onedollar;

    // Mapping to track user deposits per token
    mapping(address => mapping(address => uint256)) public userDeposits;

    // Mapping to track total deposits per token
    mapping(address => uint256) public totalDeposits;
 
    // Events
    event TokenAdded(address indexed token, address indexed admin);
    event TokenRemoved(address indexed token, address indexed admin);
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        string echo
    );
   
    // Custom errors for gas efficiency
    error TokenNotAcceptable();
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();
     modifier onlyOwner {
        require(msg.sender==owner, 'onlyowner');
        _;
     }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Adds a token to the acceptable tokens list
     * @param _token Address of the ERC20 token to add
     */
    function addAcceptableToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!onedollar[_token], "Token already acceptable");

        onedollar[_token] = true;
        emit TokenAdded(_token, msg.sender);
    }

    /**
     * @dev Removes a token from the acceptable tokens list
     * @param _token Address of the ERC20 token to remove
     */
    function removeAcceptableToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(onedollar[_token], "Token not acceptable");

        onedollar[_token] = false;
        emit TokenRemoved(_token, msg.sender);
    }
 
    /**
     * @dev Allows users to deposit acceptable stablecoins
     * @param _token Address of the ERC20 token to deposit
     * @param _amount Amount of tokens to deposit
     */
    function deposit(address _token, uint256 _amount, string calldata echo) external {
        if (!onedollar[_token]) revert TokenNotAcceptable();
        if (_amount == 0) revert InvalidAmount();

        IERC20 token = IERC20(_token);

        // Check user's balance
        require(
            token.balanceOf(msg.sender) >= _amount,
            "Insufficient token balance"
        );

        // Check allowance
        require(
            token.allowance(msg.sender, address(this)) >= _amount,
            "Insufficient allowance"
        );

        // Update state before external call
        userDeposits[msg.sender][_token] += _amount;
        totalDeposits[_token] += _amount;

        // Transfer tokens from user to contract
        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _token, _amount, echo);
    }

    /**
     * @dev Returns the contract balance for a specific token
     * @param _token Address of the token
     * @return Contract's token balance
     */
    function getContractBalance(address _token)
        external
        view
        returns (uint256)
    {
        return IERC20(_token).balanceOf(address(this));
    }
}
