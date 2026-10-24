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

export async function createFarmerOffer(procurementRequestId, payload) {
  return apiRequest(`/matching/${procurementRequestId}/farmer-offer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function acceptFarmerOffer(allocationId) {
  return apiRequest(`/allocations/${allocationId}/accept-offer`, { method: "PATCH" });
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

// Commitment workflow helpers
export async function getCommitmentBlockchainAnchors(commitmentId) {
  return apiRequest(`/blockchain/anchors/commitment/${commitmentId}`);
}

export async function approveFarmerAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/approve`, { method: "PATCH" });
}

export async function rejectFarmerAllocation(allocationId) {
  return apiRequest(`/allocations/${allocationId}/reject`, { method: "PATCH" });
}

export async function approveFarmerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}/approve`, { method: "POST" });
}

// ================================
// AUCTION HELPERS — RESTORED
// ================================

export async function getAuctionBids(auctionId) {
  return apiRequest(`/auctions/${auctionId}/bids`);
}

export async function updateFarmerAuction(auctionId, payload) {
  return apiRequest(`/auctions/${auctionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAuctionBlockchainProofs(auctionId) {
  return apiRequest(`/blockchain/anchors/auction/${auctionId}`);
}


// Farmer-confirmed reserved supply -> purchase commitment (MVP manual receipt declaration).
export async function createCommitmentFromReservedSupply(payload) {
  return apiRequest("/commitments/from-reserved", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeFarmerPaymentReceived(commitmentId) {
  return apiRequest(
    `/payments/commitments/${commitmentId}/complete-received`,
    { method: "POST" }
  );
}
