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
      auction.lot.farmer.toString() !==
      submittedByFarmer
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

    res.status(201).json({
      success: true,
      message: "External offer recorded successfully",
      data: offer,
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
      auction.lot.farmer.toString() !==
      offer.submittedByFarmer.toString()
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

    res.status(200).json({
      success: true,
      message: "External offer selected successfully",
      data: {
        auction,
        selectedOffer: offer,
      },
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
};