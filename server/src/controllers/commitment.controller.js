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
        message: "Purchase commitment already exists",
      });
    }

    if (!auction.lot) {
      return res.status(400).json({
        success: false,
        message:
          "Auction must be linked to a valid produce lot",
      });
    }

    let commitmentData;

    // -----------------------------------------
    // PLATFORM WINNER
    // -----------------------------------------

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

      // Make sure the authenticated buyer
      // is actually the winning bidder.
      if (
        bid.buyer.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the winning buyer can create this commitment",
        });
      }

      commitmentData = {
        auction: auction._id,
        lot: auction.lot._id,

        source: "platform_bid",

        buyer: bid.buyer,

        agreedPrice: bid.amount,

        quantity: auction.lot.quantity,

        unit: auction.lot.unit,

        depositPercentage: 50,

        depositAmount:
          (bid.amount *
            auction.lot.quantity *
            50) /
          100,

        status: "pending_deposit",
      };
    }

    // -----------------------------------------
    // EXTERNAL OFFER
    // -----------------------------------------

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
          message:
            "Selected external offer not found",
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

        unit: auction.lot.unit,

        depositPercentage: 50,

        depositAmount:
          (offer.offeredAmount *
            auction.lot.quantity *
            50) /
          100,

        status: "pending_deposit",
      };

      offer.status = "selected";
      await offer.save();
    }

    const commitment =
      await PurchaseCommitment.create(
        commitmentData
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

const cancelCommitment = async (req, res) => {
  try {
    const commitment = await PurchaseCommitment.findById(
      req.params.id
    );

    if (!commitment) {
      return res.status(404).json({
        success: false,
        message: "Purchase commitment not found",
      });
    }

    // Only the buyer who owns the commitment
    // can request cancellation.
    if (
      !commitment.buyer ||
      commitment.buyer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the buyer who owns this commitment can cancel it",
      });
    }

    // Only confirmed commitments can currently
    // enter the default/backout flow.
    if (commitment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message:
          "Only a confirmed commitment can be cancelled",
      });
    }

    commitment.status = "defaulted";
    commitment.failureReason =
      "Buyer cancelled after confirmation";
    commitment.reroutingStatus = "pending";

    await commitment.save();

    res.status(200).json({
      success: true,
      message:
        "Commitment cancelled and marked for rerouting",
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
        .populate("auction")
        .populate("supplyIntent")
        .populate("supplyPool")
        .populate("procurementRequest");

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
    const basePopulate = [
      { path: "lot", populate: { path: "aggregator", select: "name phone role" } },
      { path: "buyer", select: "name phone" },
      { path: "auction" },
      { path: "supplyIntent" },
      { path: "supplyPool", populate: { path: "aggregator", select: "name phone role" } },
      { path: "procurementRequest" },
    ];

    let commitments = await PurchaseCommitment.find({})
      .populate(basePopulate)
      .sort({ createdAt: -1 });

    if (req.user.role === "buyer") {
      commitments = commitments.filter(
        (item) =>
          item.buyer &&
          item.buyer._id.toString() === req.user._id.toString()
      );
    }

    if (req.user.role === "farmer") {
      commitments = commitments.filter(
        (item) =>
          item.lot?.farmer?.toString() === req.user._id.toString() ||
          item.supplyIntent?.farmer?.toString() === req.user._id.toString()
      );
    }

    if (req.user.role === "fpo" || req.user.role === "arthiya") {
      commitments = commitments.filter((item) => {
        const lotOwned =
          item.lot?.aggregator &&
          item.lot.aggregator._id.toString() === req.user._id.toString();

        const poolOwned =
          item.supplyPool?.aggregator &&
          item.supplyPool.aggregator._id.toString() === req.user._id.toString();

        return lotOwned || poolOwned;
      });
    }

    if (req.query.status) {
      commitments = commitments.filter(
        (item) => item.status === req.query.status
      );
    }

    if (req.query.source) {
      commitments = commitments.filter(
        (item) => item.source === req.query.source
      );
    }

    return res.status(200).json({
      success: true,
      count: commitments.length,
      data: commitments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCommitment,
  cancelCommitment,
  getCommitmentById,
  getCommitments,
};