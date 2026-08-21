const PurchaseCommitment =
  require("../models/PurchaseCommitment");

const Auction = require("../models/Auction");

const Bid = require("../models/Bid");

const ExternalOffer =
  require("../models/ExternalOffer");

const ProduceLot =
  require("../models/ProduceLot");

const createCommitment = async (req, res) => {
  try {
    const auction = await Auction.findById(
      req.params.id
    ).populate("lot");

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    if (
      ![
        "closed_platform_winner",
        "closed_external_offer",
      ].includes(auction.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Auction must be closed with a selected outcome first",
      });
    }

    const existingCommitment =
      await PurchaseCommitment.findOne({
        auction: auction._id,
      });

    if (existingCommitment) {
      return res.status(409).json({
        success: false,
        message:
          "Purchase commitment already exists",
      });
    }

    let commitmentData;

    if (
      auction.status ===
      "closed_platform_winner"
    ) {
      const bid = await Bid.findById(
        auction.highestBid
      );

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: "Winning bid not found",
        });
      }

      commitmentData = {
        auction: auction._id,
        lot: auction.lot._id,
        source: "platform_bid",
        buyer: bid.buyer,
        agreedPrice: bid.amount,
        quantity: auction.lot.quantity,
      };
    }

    if (
      auction.status ===
      "closed_external_offer"
    ) {
      const offer =
        await ExternalOffer.findById(
          auction.selectedExternalOffer
        );

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Selected external offer not found",
        });
      }

      commitmentData = {
        auction: auction._id,
        lot: auction.lot._id,
        source: "external_offer",
        externalBuyerName:
          offer.buyerName,
        externalBuyerPhone:
          offer.buyerPhone,
        agreedPrice:
          offer.offeredAmount,
        quantity: auction.lot.quantity,
      };

      offer.status = "selected";
      await offer.save();
    }

    const commitment =
      await PurchaseCommitment.create(
        commitmentData
      );

    await ProduceLot.findByIdAndUpdate(
      auction.lot._id,
      {
        status: "committed",
      }
    );

    res.status(201).json({
      success: true,
      message:
        "Purchase commitment created successfully",
      data: commitment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCommitmentById = async (
  req,
  res
) => {
  try {
    const commitment =
      await PurchaseCommitment.findById(
        req.params.id
      )
        .populate("lot")
        .populate("buyer", "name phone")
        .populate("auction");

    if (!commitment) {
      return res.status(404).json({
        success: false,
        message:
          "Purchase commitment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: commitment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCommitments = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.source) {
      filter.source = req.query.source;
    }

    const commitments =
      await PurchaseCommitment.find(filter)
        .populate("lot")
        .populate("buyer", "name phone")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: commitments.length,
      data: commitments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCommitment,
  getCommitmentById,
  getCommitments,
};