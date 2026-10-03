import { apiRequest } from "./api";

// ========================================
// BUYER — REQUIREMENTS
// ========================================

export async function getBuyerRequirements(buyerId) {
  const query = buyerId
    ? `?buyer=${encodeURIComponent(buyerId)}`
    : "";

  return apiRequest(`/procurement-requests${query}`);
}

export async function createBuyerRequirement(payload) {
  return apiRequest("/procurement-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBuyerRequirement(
  requirementId,
  payload
) {
  return apiRequest(`/procurement-requests/${requirementId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ========================================
// BUYER — MATCHING
// ========================================

export async function getBuyerMatches(procurementRequestId) {
  return apiRequest(
    `/matching/${procurementRequestId}`
  );
}

export async function runBuyerMatching(
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
// BUYER — AUCTIONS
// ========================================

export async function getBuyerAuctions() {
  return apiRequest("/auctions");
}

export async function getBuyerAuction(auctionId) {
  return apiRequest(`/auctions/${auctionId}`);
}

// ========================================
// BUYER — BIDS
// ========================================

export async function placeBid(auctionId, payload) {
  return apiRequest(
    `/auctions/${auctionId}/bids`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getAuctionBids(auctionId) {
  return apiRequest(
    `/auctions/${auctionId}/bids`
  );
}

// ========================================
// BUYER — COMMITMENTS
// ========================================

export async function getBuyerCommitments() {
  return apiRequest("/commitments");
}

export async function getBuyerCommitment(commitmentId) {
  return apiRequest(`/commitments/${commitmentId}`);
}

export async function cancelBuyerCommitment(
  commitmentId
) {
  return apiRequest(
    `/commitments/${commitmentId}/cancel`,
    {
      method: "POST",
    }
  );
}

// ========================================
// BUYER — PAYMENTS
// ========================================

export async function paySecurityDeposit(
  commitmentId
) {
  return apiRequest(
    `/payments/commitments/${commitmentId}/deposit`,
    {
      method: "POST",
      body: JSON.stringify({
        paymentMethod: "demo",
      }),
    }
  );
}

export async function getBuyerPayments() {
  return apiRequest("/payments");
}