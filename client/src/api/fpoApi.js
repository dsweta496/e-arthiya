import { apiRequest } from "./api";

// ========================================
// FPO — SUPPLY POOLS
// ========================================

export async function getSupplyPools() {
  return apiRequest("/supply-pools");
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

export async function updateSupplyPool(
  poolId,
  payload
) {
  return apiRequest(`/supply-pools/${poolId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ========================================
// FPO — DEMAND
// ========================================

export async function getFPODemand() {
  return apiRequest("/procurement-requests");
}

export async function getFPORequirement(
  requirementId
) {
  return apiRequest(
    `/procurement-requests/${requirementId}`
  );
}

// ========================================
// FPO — FARMER SUPPLY
// ========================================

export async function getFPOFarmerSupply() {
  return apiRequest("/lots");
}

export async function getFPOSupplyIntents() {
  return apiRequest("/supply-intents");
}

// ========================================
// FPO — MATCHING
// ========================================

export async function getFPOMatches(
  procurementRequestId
) {
  return apiRequest(
    `/matching/${procurementRequestId}`
  );
}

export async function runFPOMatching(
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
// FPO — COMMITMENTS
// ========================================

export async function getFPOCommitments() {
  return apiRequest("/commitments");
}

// ========================================
// FPO — PAYMENTS
// ========================================

export async function getFPOPayments() {
  return apiRequest("/payments");
}