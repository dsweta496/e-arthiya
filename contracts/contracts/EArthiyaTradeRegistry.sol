// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Stores hashes of selected trade events, not personal or commercial raw data.
contract EArthiyaTradeRegistry {
    address public owner;
    mapping(address => bool) public operators;
    mapping(bytes32 => bool) public recordedEventIds;

    event OperatorUpdated(address indexed operator, bool enabled);
    event TradeEventRecorded(
        bytes32 indexed eventId,
        bytes32 indexed entityIdHash,
        bytes32 indexed eventType,
        bytes32 payloadHash,
        address recordedBy,
        uint256 recordedAt
    );

    error NotOwner();
    error NotOperator();
    error InvalidInput();
    error EventAlreadyRecorded();

    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
        emit OperatorUpdated(msg.sender, true);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (!operators[msg.sender]) revert NotOperator();
        _;
    }

    function setOperator(address operator, bool enabled) external onlyOwner {
        if (operator == address(0)) revert InvalidInput();
        operators[operator] = enabled;
        emit OperatorUpdated(operator, enabled);
    }

    function recordTradeEvent(
        bytes32 eventId,
        bytes32 entityIdHash,
        bytes32 eventType,
        bytes32 payloadHash
    ) external onlyOperator {
        if (
            eventId == bytes32(0) || entityIdHash == bytes32(0) ||
            eventType == bytes32(0) || payloadHash == bytes32(0)
        ) revert InvalidInput();
        if (recordedEventIds[eventId]) revert EventAlreadyRecorded();

        recordedEventIds[eventId] = true;
        emit TradeEventRecorded(
            eventId, entityIdHash, eventType, payloadHash, msg.sender, block.timestamp
        );
    }
}
