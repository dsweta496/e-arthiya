import { apiRequest } from "./api";

function queryString(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (!entries.length) return "";

  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
}

// --------------------------------------------------
// FARMER NETWORK
// --------------------------------------------------

export async function getFPOFarmers(params = {}) {
  return apiRequest(`/users${queryString({ role: "farmer", ...params })}`);
}

export async function getFPOFarmer(farmerId) {
  return apiRequest(`/users/${farmerId}`);
}

// --------------------------------------------------
// FARMER SUPPLY
// --------------------------------------------------

export async function getFPOFarmerSupply(params = {}) {
  return apiRequest(`/lots${queryString(params)}`);
}

export async function getFPOSupplyIntents(params = {}) {
  return apiRequest(`/supply-intents${queryString(params)}`);
}

// --------------------------------------------------
// MARKETPLACE
// --------------------------------------------------

export async function getFPOMarketplace(params = {}) {
  return getFPOFarmerSupply({
    status: "available",
    ...params,
  });
}

// --------------------------------------------------
// BUYER DEMAND
// --------------------------------------------------

export async function getFPODemand(params = {}) {
  return apiRequest(`/procurement-requests${queryString(params)}`);
}

export async function getFPORequirement(requirementId) {
  return apiRequest(`/procurement-requests/${requirementId}`);
}

// --------------------------------------------------
// MATCHING
// --------------------------------------------------

export async function getFPOMatches(procurementRequestId) {
  return apiRequest(`/matching/${procurementRequestId}`);
}

export async function runFPOMatching(procurementRequestId) {
  return apiRequest(`/matching/${procurementRequestId}/run`, {
    method: "POST",
  });
}

// --------------------------------------------------
// SUPPLY POOLS
// --------------------------------------------------

export async function getSupplyPools(params = {}) {
  return apiRequest(`/supply-pools${queryString(params)}`);
}

export async function getSupplyPool(poolId) {
  return apiRequest(`/supply-pools/${poolId}`);
}

export async function createSupplyPool(payload) {
  return apiRequest("/supply-pools", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------
// ALLOCATIONS
// --------------------------------------------------

export async function getFPOAllocations(params = {}) {
  return apiRequest(`/allocations${queryString(params)}`);
}

export async function getAllocationAvailability(sourceType, sourceId) {
  return apiRequest(`/allocations/availability/${sourceType}/${sourceId}`);
}

export async function commitAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/commit`, {
    method: "PATCH",
  });
}

export async function fulfillAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/fulfill`, {
    method: "PATCH",
  });
}

// --------------------------------------------------
// COMMITMENTS / DEALS
// --------------------------------------------------

export async function getFPOCommitments(params = {}) {
  return apiRequest(`/commitments${queryString(params)}`);
}

export async function getFPOCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

// --------------------------------------------------
// SETTLEMENTS
// --------------------------------------------------

export async function getFPOSettlements(params = {}) {
  return apiRequest(`/payments${queryString(params)}`);
}
