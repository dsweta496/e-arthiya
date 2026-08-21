const express = require("express");

const {
  createAuction,
  getAuctions,
  getAuctionById,
  closeAuction,
} = require("../controllers/auction.controller");

const {
  createBid,
  getAuctionBids,
} = require("../controllers/bid.controller");

const {
  createExternalOffer,
  getExternalOffers,
  selectExternalOffer,
} = require("../controllers/externalOffer.controller");

const {
  createCommitment,
} = require("../controllers/commitment.controller");

const router = express.Router();

router.post("/", createAuction);

router.get("/", getAuctions);

router.get("/:id", getAuctionById);

router.post("/:id/close", closeAuction);

router.post("/:id/bids", createBid);

router.get("/:id/bids", getAuctionBids);

router.post(
  "/:id/external-offers",
  createExternalOffer
);

router.get(
  "/:id/external-offers",
  getExternalOffers
);

router.post(
  "/:id/external-offers/:offerId/select",
  selectExternalOffer
);

router.post("/:id/commit", createCommitment);

module.exports = router;