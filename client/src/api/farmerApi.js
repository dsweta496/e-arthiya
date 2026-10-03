import { apiRequest } from "./api";

// ========================================
// FARMER — SUPPLY
// ========================================

export async function getFarmerLots(farmerId) {
  const query = farmerId
    ? `?farmer=${encodeURIComponent(farmerId)}`
    : "";

  return apiRequest(`/lots${query}`);
}

export async function createFarmerLot(payload) {
  return apiRequest("/lots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFarmerLot(lotId, payload) {
  return apiRequest(`/lots/${lotId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ========================================
// FARMER — PREORDER SUPPLY
// ========================================

export async function getFarmerSupplyIntents(farmerId) {
  const query = farmerId
    ? `?farmer=${encodeURIComponent(farmerId)}`
    : "";

  return apiRequest(`/supply-intents${query}`);
}

export async function createFarmerSupplyIntent(payload) {
  return apiRequest("/supply-intents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFarmerSupplyIntent(
  supplyIntentId,
  payload
) {
  return apiRequest(`/supply-intents/${supplyIntentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ========================================
// FARMER — AUCTIONS
// ========================================

export async function getFarmerAuctions() {
  return apiRequest("/auctions");
}

export async function getFarmerAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}`);
}

export async function createFarmerAuction(payload) {
  return apiRequest("/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function closeFarmerAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}/close`, {
    method: "POST",
  });
}

// ========================================
// FARMER — EXTERNAL OFFERS
// ========================================

export async function getExternalOffers(auctionId) {
  return apiRequest(`/auctions/${auctionId}/external-offers`);
}

export async function selectExternalOffer(
  auctionId,
  offerId
) {
  return apiRequest(
    `/auctions/${auctionId}/external-offers/${offerId}/select`,
    {
      method: "POST",
    }
  );
}

// ========================================
// FARMER — COMMITMENTS
// ========================================

export async function getFarmerCommitments() {
  return apiRequest("/commitments");
}

export async function getFarmerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

// ========================================
// FARMER — PAYMENTS
// ========================================

export async function getFarmerPayments() {
  return apiRequest("/payments");
}

export async function getFarmerPayment(paymentId) {
  return apiRequest(`/payments/${paymentId}`);
}