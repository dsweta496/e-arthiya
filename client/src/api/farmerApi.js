import { apiRequest } from "./api";

const queryString = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const value = search.toString();
  return value ? `?${value}` : "";
};

const farmerQuery = (farmerId, extra = {}) =>
  queryString({ farmer: farmerId, ...extra });

// ================================
// SUPPLY
// ================================

export async function getFarmerLots(farmerId) {
  return apiRequest(`/lots${farmerQuery(farmerId)}`);
}

export async function getFarmerMarketplaceLots() {
  return apiRequest("/lots?status=available&marketplace=true");
}

export async function getFarmerLot(lotId) {
  return apiRequest(`/lots/${lotId}`);
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

export async function cancelFarmerLot(lotId) {
  return updateFarmerLot(lotId, { status: "cancelled" });
}

// ================================
// FUTURE / PREORDER SUPPLY
// ================================

export async function getFarmerSupplyIntents(farmerId) {
  return apiRequest(`/supply-intents${farmerQuery(farmerId)}`);
}

export async function getFarmerSupplyIntent(intentId) {
  return apiRequest(`/supply-intents/${intentId}`);
}

export async function createFarmerSupplyIntent(payload) {
  return apiRequest("/supply-intents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFarmerSupplyIntent(intentId, payload) {
  return apiRequest(`/supply-intents/${intentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function cancelFarmerSupplyIntent(intentId) {
  return updateFarmerSupplyIntent(intentId, { status: "cancelled" });
}

// ================================
// BUYER DEMAND / OPPORTUNITIES
// ================================

export async function getFarmerDemand(params = {}) {
  return apiRequest(`/procurement-requests${queryString(params)}`);
}

export async function getFarmerDemandMatches(procurementRequestId) {
  return apiRequest(`/matching/${procurementRequestId}`);
}

// ================================
// AUCTIONS
// ================================

export async function getFarmerAuctions(farmerId, status) {
  return apiRequest(`/auctions${farmerQuery(farmerId, { status })}`);
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

export async function closeFarmerAuction(auctionId, result) {
  return apiRequest(`/auctions/${auctionId}/close`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

export async function getAuctionExternalOffers(auctionId) {
  return apiRequest(`/auctions/${auctionId}/external-offers`);
}

export async function createExternalOffer(auctionId, payload) {
  return apiRequest(`/auctions/${auctionId}/external-offers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function selectExternalOffer(auctionId, offerId) {
  return apiRequest(`/auctions/${auctionId}/external-offers/${offerId}/select`, {
    method: "POST",
  });
}

// ================================
// COMMITMENTS
// ================================

export async function getFarmerCommitments(params = {}) {
  return apiRequest(`/commitments${queryString(params)}`);
}

export async function getFarmerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

// ================================
// PAYMENTS
// ================================

export async function getFarmerPayments(params = {}) {
  return apiRequest(`/payments${queryString(params)}`);
}

export async function getFarmerPayment(paymentId) {
  return apiRequest(`/payments/${paymentId}`);
}

// ================================
// ALLOCATIONS / MATCHED QUANTITY
// ================================

export async function getFarmerAllocations(farmerId, params = {}) {
  return apiRequest(`/allocations${queryString({ farmer: farmerId, ...params })}`);
}

export async function getFarmerAllocationAvailability(sourceType, sourceId) {
  return apiRequest(`/allocations/availability/${sourceType}/${sourceId}`);
}
