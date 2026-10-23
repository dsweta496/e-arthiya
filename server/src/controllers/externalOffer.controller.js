const { recordBlockchainAnchor } = require("../services/blockchainAnchor.service");
const ExternalOffer = require("../models/ExternalOffer");
const Auction = require("../models/Auction");
const ProduceLot = require("../models/ProduceLot");

const createExternalOffer = async (req, res) => {
  try {
    const {
      offeredAmount,
      buyerName,
      buyerPhone,
      submittedByFarmer,
      evidence,
    } = req.body;

    if (
      offeredAmount === undefined ||
      !buyerName ||
      !submittedByFarmer
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Offered amount, buyer name and farmer are required",
      });
    }

    const auction = await Auction.findById(
      req.params.id
    ).populate("lot");

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    if (auction.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Auction is not open",
      });
    }

    if (
      auction.lot.farmer.toString() !== submittedByFarmer ||
      req.user._id.toString() !== submittedByFarmer
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the farmer who owns the lot can submit an external offer",
      });
    }

    const offer = await ExternalOffer.create({
      auction: auction._id,
      offeredAmount,
      buyerName,
      buyerPhone,
      submittedByFarmer,
      evidence,
    });

    const blockchain = await recordBlockchainAnchor({
      entityType: "external_offer",
      entityId: offer._id,
      eventType: "EXTERNAL_OFFER_CREATED",
      // Do not place buyer names, phone numbers, or evidence contents in the public-chain payload.
      payload: {
        offerId: String(offer._id),
        auctionId: String(auction._id),
        offeredAmount: offer.offeredAmount,
        status: offer.status,
      },
      recordedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "External offer recorded successfully",
      data: offer,
      blockchain,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getExternalOffers = async (req, res) => {
  try {
    const offers = await ExternalOffer.find({
      auction: req.params.id,
    })
      .populate(
        "submittedByFarmer",
        "name phone"
      )
      .sort({
        offeredAmount: -1,
        createdAt: 1,
      });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectExternalOffer = async (req, res) => {
  try {
    const { id: auctionId, offerId } = req.params;
    const auction = await Auction.findById(auctionId).populate("lot");
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    if (!auction.lot || auction.lot.farmer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Only the farmer who owns this lot can reject its external offers" });
    if (auction.status !== "open") return res.status(409).json({ success: false, message: "Offers can only be rejected while the auction is open" });
    const offer = await ExternalOffer.findOne({ _id: offerId, auction: auction._id });
    if (!offer) return res.status(404).json({ success: false, message: "External offer not found for this auction" });
    if (offer.status !== "recorded") return res.status(409).json({ success: false, message: "Only recorded offers can be rejected" });
    offer.status = "rejected";
    await offer.save();
    return res.json({ success: true, message: "External offer rejected", data: offer });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to reject external offer" }); }
};

const selectExternalOffer = async (req, res) => {
  try {
    const { id: auctionId, offerId } = req.params;

    const auction = await Auction.findById(auctionId)
      .populate("lot");

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    if (auction.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Auction is not open",
      });
    }

    const offer = await ExternalOffer.findById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "External offer not found",
      });
    }

    if (
      offer.auction.toString() !==
      auctionId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This offer does not belong to this auction",
      });
    }

    if (
      auction.lot.farmer.toString() !== offer.submittedByFarmer.toString() ||
      req.user._id.toString() !== auction.lot.farmer.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the farmer who owns the lot can select this offer",
      });
    }

    await ExternalOffer.updateMany(
      { auction: auctionId },
      { status: "rejected" }
    );

    offer.status = "selected";
    await offer.save();

    auction.selectedExternalOffer = offer._id;
    await auction.save();
    const blockchain = await recordBlockchainAnchor({ entityType: "external_offer", entityId: offer._id, eventType: "EXTERNAL_OFFER_SELECTED", payload: { offerId: String(offer._id), auctionId: String(auction._id), offeredAmount: offer.offeredAmount, status: offer.status }, recordedBy: req.user._id });

    res.status(200).json({
      success: true,
      message: "External offer selected successfully",
      data: {
        auction,
        selectedOffer: offer,
      },
      blockchain,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createExternalOffer,
  getExternalOffers,
  selectExternalOffer,
  rejectExternalOffer,
};