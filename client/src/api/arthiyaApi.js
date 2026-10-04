import { apiRequest } from "./api";

// -----------------------------------------------------------------------------
// FARMER NETWORK
// -----------------------------------------------------------------------------

export async function getArthiyaFarmerSupply(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.crop) query.set("crop", params.crop);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/lots${suffix}`);
}

export async function getArthiyaSupplyIntents(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.crop) query.set("crop", params.crop);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/supply-intents${suffix}`);
}

// -----------------------------------------------------------------------------
// SUPPLY POOLS
// -----------------------------------------------------------------------------

export async function getArthiyaSupplyPools(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.crop) query.set("crop", params.crop);
  query.set("aggregatorType", "arthiya");

  const suffix = `?${query.toString()}`;
  return apiRequest(`/supply-pools${suffix}`);
}

export async function getArthiyaSupplyPool(poolId) {
  return apiRequest(`/supply-pools/${poolId}`);
}

export async function createArthiyaSupplyPool(payload) {
  return apiRequest("/supply-pools", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// -----------------------------------------------------------------------------
// MARKET DEMAND
// -----------------------------------------------------------------------------

export async function getArthiyaDemand(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.crop) query.set("crop", params.crop);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/procurement-requests${suffix}`);
}

export async function getArthiyaRequirement(requirementId) {
  return apiRequest(`/procurement-requests/${requirementId}`);
}

// -----------------------------------------------------------------------------
// MATCHING
// -----------------------------------------------------------------------------

export async function getArthiyaMatches(procurementRequestId) {
  return apiRequest(`/matching/${procurementRequestId}`);
}

export async function runArthiyaMatching(procurementRequestId) {
  return apiRequest(`/matching/${procurementRequestId}/run`, {
    method: "POST",
  });
}

// -----------------------------------------------------------------------------
// AUCTIONS
// -----------------------------------------------------------------------------

export async function getArthiyaAuctions(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/auctions${suffix}`);
}

export async function getArthiyaAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}`);
}

export async function createArthiyaAuction(payload) {
  return apiRequest("/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function closeArthiyaAuction(auctionId, result) {
  return apiRequest(`/auctions/${auctionId}/close`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

export async function getArthiyaAuctionBids(auctionId) {
  return apiRequest(`/auctions/${auctionId}/bids`);
}

// -----------------------------------------------------------------------------
// ALLOCATIONS
// -----------------------------------------------------------------------------

export async function getArthiyaAllocations(params = {}) {
  const query = new URLSearchParams();

  if (params.procurementRequest) {
    query.set("procurementRequest", params.procurementRequest);
  }
  if (params.status) query.set("status", params.status);
  if (params.sourceType) query.set("sourceType", params.sourceType);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/allocations${suffix}`);
}

export async function getArthiyaAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}`);
}

export async function getArthiyaAvailability(sourceType, sourceId) {
  return apiRequest(`/allocations/availability/${sourceType}/${sourceId}`);
}

// -----------------------------------------------------------------------------
// DEALS / COMMITMENTS
// -----------------------------------------------------------------------------

export async function getArthiyaCommitments(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.source) query.set("source", params.source);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/commitments${suffix}`);
}

export async function getArthiyaCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

// -----------------------------------------------------------------------------
// SETTLEMENTS / PAYMENTS
// -----------------------------------------------------------------------------

export async function getArthiyaPayments(params = {}) {
  const query = new URLSearchParams();

  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/payments${suffix}`);
}

export async function getArthiyaPayment(paymentId) {
  return apiRequest(`/payments/${paymentId}`);
}

// -----------------------------------------------------------------------------
// SMALL HELPERS
// -----------------------------------------------------------------------------

export function extractRecords(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.allocations)) return response.allocations;
  if (Array.isArray(response?.matches)) return response.matches;
  return [];
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}
