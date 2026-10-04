import { apiRequest } from "./api";

function queryString(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (!entries.length) return "";

  const search = new URLSearchParams();
  entries.forEach(([key, value]) => search.set(key, value));
  return `?${search.toString()}`;
}

function unwrap(response, keys = ["data", "matches", "allocations"]) {
  for (const key of keys) {
    if (response?.[key] !== undefined) return response[key];
  }
  return response;
}

// ============================================================
// REQUIREMENTS / DEMAND
// ============================================================

export async function getBuyerRequirements(params = {}) {
  return apiRequest(`/procurement-requests${queryString(params)}`);
}

export async function getBuyerRequirement(requirementId) {
  return apiRequest(`/procurement-requests/${requirementId}`);
}

export async function createBuyerRequirement(payload) {
  return apiRequest("/procurement-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBuyerRequirement(requirementId, payload) {
  return apiRequest(`/procurement-requests/${requirementId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function cancelBuyerRequirement(requirementId) {
  return updateBuyerRequirement(requirementId, {
    status: "cancelled",
  });
}

// ============================================================
// AVAILABLE SUPPLY
// ============================================================

export async function getBuyerSupply(params = {}) {
  return apiRequest(`/lots${queryString({ status: "available", ...params })}`);
}

export async function getBuyerLot(lotId) {
  return apiRequest(`/lots/${lotId}`);
}

// ============================================================
// MATCHING
// ============================================================

export async function getBuyerMatches(requirementId) {
  return apiRequest(`/matching/${requirementId}`);
}

export async function runBuyerMatching(requirementId) {
  return apiRequest(`/matching/${requirementId}/run`, {
    method: "POST",
  });
}

// ============================================================
// AUCTIONS
// ============================================================

export async function getBuyerAuctions(params = {}) {
  return apiRequest(`/auctions${queryString(params)}`);
}

export async function getBuyerAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}`);
}

export async function placeBid(auctionId, amount) {
  return apiRequest(`/auctions/${auctionId}/bids`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getAuctionBids(auctionId) {
  return apiRequest(`/auctions/${auctionId}/bids`);
}

export async function commitWinningAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}/commit`, {
    method: "POST",
  });
}

// ============================================================
// COMMITMENTS
// ============================================================

export async function getBuyerCommitments(params = {}) {
  return apiRequest(`/commitments${queryString(params)}`);
}

export async function getBuyerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

export async function cancelBuyerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}/cancel`, {
    method: "POST",
  });
}

// ============================================================
// PAYMENTS
// ============================================================

export async function paySecurityDeposit(commitmentId) {
  return apiRequest(`/payments/commitments/${commitmentId}/deposit`, {
    method: "POST",
    body: JSON.stringify({ paymentMethod: "demo" }),
  });
}

export async function getBuyerPayments(params = {}) {
  return apiRequest(`/payments${queryString(params)}`);
}

export async function getBuyerPayment(paymentId) {
  return apiRequest(`/payments/${paymentId}`);
}

// ============================================================
// ALLOCATIONS / MATCHED SUPPLY RESERVATIONS
// ============================================================

export async function getBuyerAllocations(params = {}) {
  return apiRequest(`/allocations${queryString(params)}`);
}

export async function getBuyerAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}`);
}

export async function releaseBuyerAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/release`, {
    method: "PATCH",
  });
}

export async function commitBuyerAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/commit`, {
    method: "PATCH",
  });
}

export async function getBuyerSourceAvailability(sourceType, sourceId) {
  return apiRequest(`/allocations/availability/${sourceType}/${sourceId}`);
}

export { unwrap };
