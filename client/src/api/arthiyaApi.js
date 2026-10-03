import { apiRequest } from "./api";

// ========================================
// ARTHIYA — FARMER NETWORK
// ========================================

export async function getArthiyaFarmerSupply() {
  return apiRequest("/lots");
}

export async function getArthiyaSupplyIntents() {
  return apiRequest("/supply-intents");
}

// ========================================
// ARTHIYA — SUPPLY POOLS
// ========================================

export async function getArthiyaSupplyPools() {
  return apiRequest("/supply-pools");
}

export async function getArthiyaSupplyPool(poolId) {
  return apiRequest(`/supply-pools/${poolId}`);
}

export async function createArthiyaSupplyPool(
  payload
) {
  return apiRequest("/supply-pools", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ========================================
// ARTHIYA — MARKET DEMAND
// ========================================

export async function getArthiyaDemand() {
  return apiRequest("/procurement-requests");
}

export async function getArthiyaRequirement(
  requirementId
) {
  return apiRequest(
    `/procurement-requests/${requirementId}`
  );
}

// ========================================
// ARTHIYA — MATCHING
// ========================================

export async function getArthiyaMatches(
  procurementRequestId
) {
  return apiRequest(
    `/matching/${procurementRequestId}`
  );
}

export async function runArthiyaMatching(
  procurementRequestId
) {
  return apiRequest(
    `/matching/${procurementRequestId}/run`,
    {
      method: "POST",
    }
  );
}

// ========================================
// ARTHIYA — AUCTIONS
// ========================================

export async function getArthiyaAuctions() {
  return apiRequest("/auctions");
}

export async function createArthiyaAuction(
  payload
) {
  return apiRequest("/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ========================================
// ARTHIYA — COMMITMENTS
// ========================================

export async function getArthiyaCommitments() {
  return apiRequest("/commitments");
}

// ========================================
// ARTHIYA — PAYMENTS
// ========================================

export async function getArthiyaPayments() {
  return apiRequest("/payments");
}