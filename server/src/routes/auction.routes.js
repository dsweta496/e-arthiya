const express = require("express");

const {
  createAuction,
  getAuctions,
  getAuctionById,
  closeAuction,
  updateAuction,
  cancelAuction,
} = require("../controllers/auction.controller");

const {
  createBid,
  getAuctionBids,
} = require("../controllers/bid.controller");

const {
  createExternalOffer,
  getExternalOffers,
  selectExternalOffer,
  rejectExternalOffer,
} = require("../controllers/externalOffer.controller");

const {
  createCommitment,
  approveCommitmentAfterDeposit,
} = require("../controllers/commitment.controller");

const {
  protect,
  authorizeRoles,
  requireVerifiedOrganization,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Auction
router.post(
  "/",
  protect,
  authorizeRoles("farmer", "fpo", "arthiya"),
  requireVerifiedOrganization,
  createAuction
);

router.get(
  "/",
  protect,
  getAuctions
);

router.get(
  "/:id",
  protect,
  getAuctionById
);

router.patch("/:id", protect, authorizeRoles("farmer", "fpo", "arthiya"), requireVerifiedOrganization, updateAuction);
router.post("/:id/cancel", protect, authorizeRoles("farmer", "fpo", "arthiya"), requireVerifiedOrganization, cancelAuction);

router.post(
  "/:id/close",
  protect,
  authorizeRoles("farmer", "fpo", "arthiya"),
  requireVerifiedOrganization,
  closeAuction
);

// Bids — Buyer
router.post(
  "/:id/bids",
  protect,
  authorizeRoles("buyer"),
  createBid
);

router.get(
  "/:id/bids",
  protect,
  getAuctionBids
);

// External offers — Farmer
router.post(
  "/:id/external-offers",
  protect,
  authorizeRoles("farmer"),
  createExternalOffer
);

router.get(
  "/:id/external-offers",
  protect,
  getExternalOffers
);

router.post(
  "/:id/external-offers/:offerId/reject",
  protect,
  authorizeRoles("farmer"),
  rejectExternalOffer
);

router.post(
  "/:id/external-offers/:offerId/select",
  protect,
  authorizeRoles("farmer"),
  selectExternalOffer
);

// Commitment
router.post(
  "/:id/commit",
  protect,
  authorizeRoles("buyer"),
  createCommitment
);

module.exports = router;