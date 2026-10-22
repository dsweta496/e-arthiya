const { ethers } = require("ethers");

const EVENT_TYPES = new Set([
  "COMMITMENT_CONFIRMED",
  "DEPOSIT_RECORDED",
  "TRADE_FULFILLED",
  "PAYMENT_SETTLED",
  "ALLOCATION_RESERVED",
]);

const ABI = [
  "function recordTradeEvent(bytes32 eventId, bytes32 entityIdHash, bytes32 eventType, bytes32 payloadHash) external",
  "function recordedEventIds(bytes32) view returns (bool)",
  "event TradeEventRecorded(bytes32 indexed eventId, bytes32 indexed entityIdHash, bytes32 indexed eventType, bytes32 payloadHash, address recordedBy, uint256 recordedAt)",
];

function getConfig() {
  const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_CONTRACT_ADDRESS, BLOCKCHAIN_PRIVATE_KEY } = process.env;
  if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_CONTRACT_ADDRESS || !BLOCKCHAIN_PRIVATE_KEY) {
    const error = new Error(
      "Blockchain is not configured. Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_CONTRACT_ADDRESS, and BLOCKCHAIN_PRIVATE_KEY."
    );
    error.statusCode = 503;
    throw error;
  }
  if (!ethers.isAddress(BLOCKCHAIN_CONTRACT_ADDRESS)) {
    const error = new Error("BLOCKCHAIN_CONTRACT_ADDRESS is not a valid address.");
    error.statusCode = 500;
    throw error;
  }
  return { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_CONTRACT_ADDRESS, BLOCKCHAIN_PRIVATE_KEY };
}

function makeProvider() {
  const { BLOCKCHAIN_RPC_URL } = getConfig();
  return new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
}

function makeReadContract() {
  const { BLOCKCHAIN_CONTRACT_ADDRESS } = getConfig();
  return new ethers.Contract(BLOCKCHAIN_CONTRACT_ADDRESS, ABI, makeProvider());
}

function validateInput({ entityType, entityId, eventType, payload }) {
  if (typeof entityType !== "string" || !/^[a-zA-Z0-9_-]{2,40}$/.test(entityType)) {
    const error = new Error("entityType must be 2-40 letters, numbers, underscores or hyphens.");
    error.statusCode = 400;
    throw error;
  }
  if (typeof entityId !== "string" || entityId.trim().length < 1 || entityId.length > 128) {
    const error = new Error("entityId must be a non-empty string up to 128 characters.");
    error.statusCode = 400;
    throw error;
  }
  if (!EVENT_TYPES.has(eventType)) {
    const error = new Error(`eventType must be one of: ${[...EVENT_TYPES].join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const error = new Error("payload must be a JSON object containing only non-sensitive event facts.");
    error.statusCode = 400;
    throw error;
  }
  const serialized = JSON.stringify(payload);
  if (serialized.length > 4000) {
    const error = new Error("payload is too large (maximum 4000 serialized characters).");
    error.statusCode = 400;
    throw error;
  }
  return serialized;
}

async function anchorTradeEvent(input) {
  const serializedPayload = validateInput(input);
  const { BLOCKCHAIN_PRIVATE_KEY } = getConfig();
  const provider = makeProvider();
  const wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
    ABI,
    wallet
  );

  const entityKey = `${input.entityType}:${input.entityId}`;
  const eventKey = `${entityKey}:${input.eventType}`;
  const eventId = ethers.id(eventKey);
  const entityIdHash = ethers.id(entityKey);
  const eventTypeHash = ethers.id(input.eventType);
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(serializedPayload));

  if (await contract.recordedEventIds(eventId)) {
    const error = new Error("This event has already been anchored on-chain.");
    error.statusCode = 409;
    throw error;
  }

  const tx = await contract.recordTradeEvent(eventId, entityIdHash, eventTypeHash, payloadHash);
  const receipt = await tx.wait();
  return {
    success: true,
    eventId,
    entityIdHash,
    eventType: input.eventType,
    payloadHash,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
    network: (await provider.getNetwork()).name,
  };
}

async function getAnchorStatus(eventId) {
  if (typeof eventId !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(eventId)) {
    const error = new Error("eventId must be a 32-byte hex hash.");
    error.statusCode = 400;
    throw error;
  }
  const contract = makeReadContract();
  return { eventId, recorded: await contract.recordedEventIds(eventId) };
}

module.exports = { anchorTradeEvent, getAnchorStatus, EVENT_TYPES };
