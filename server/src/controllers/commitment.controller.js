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


const getCommitmentById = async (req, res) => {
  try {
    const commitment = await PurchaseCommitment.findById(
      req.params.id
    )
      .populate({
        path: "lot",
        populate: [
          { path: "farmer", select: "name phone role" },
          { path: "aggregator", select: "name phone role" },
        ],
      })
      .populate("buyer", "name phone role")
      .populate("auction")
      .populate({
        path: "supplyIntent",
        populate: {
          path: "farmer",
          select: "name phone role",
        },
      })
      .populate({
        path: "supplyPool",
        populate: {
          path: "aggregator",
          select: "name phone role",
        },
      })
      .populate("procurementRequest");

    if (!commitment) {
      return res.status(404).json({
        success: false,
        message: "Purchase commitment not found",
      });
    }

    const userId = req.user._id.toString();

    const sameUser = (user) =>
      user && user._id.toString() === userId;

    const lot = commitment.lot;
    const supplyIntent = commitment.supplyIntent;
    const supplyPool = commitment.supplyPool;

    const isAuthorized =
      req.user.role === "admin" ||
      sameUser(commitment.buyer) ||
      sameUser(lot?.farmer) ||
      sameUser(lot?.aggregator) ||
      sameUser(supplyIntent?.farmer) ||
      sameUser(supplyPool?.aggregator);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this commitment",
      });
    }

    return res.status(200).json({
      success: true,
      data: commitment,
    });
  } catch (error) {
    console.error("Get commitment by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve purchase commitment",
    });
  }
};


const getCommitments = async (req, res) => {
  try {
    const basePopulate = [
      {
        path: "lot",
        populate: [
          { path: "farmer", select: "name phone role" },
          { path: "aggregator", select: "name phone role" },
        ],
      },
      { path: "buyer", select: "name phone role" },
      { path: "auction" },
      {
        path: "supplyIntent",
        populate: [
          { path: "farmer", select: "name phone role" },
          { path: "aggregator", select: "name phone role" },
        ],
      },
      {
        path: "supplyPool",
        populate: [
          { path: "aggregator", select: "name phone role" },
          {
            path: "contributors.farmer",
            select: "name phone role",
          },
        ],
      },
      { path: "procurementRequest" },
    ];

    let commitments = await PurchaseCommitment.find({})
      .populate(basePopulate)
      .sort({ createdAt: -1 });

    const userId = req.user._id.toString();

    const sameUser = (user) => {
      if (!user) return false;

      const id = user._id ? user._id : user;

      return id.toString() === userId;
    };

    if (req.user.role === "buyer") {
      commitments = commitments.filter(
        (item) => sameUser(item.buyer)
      );
    } else if (req.user.role === "farmer") {
      commitments = commitments.filter((item) => {
        const ownsLot = sameUser(item.lot?.farmer);

        const ownsIntent = sameUser(
          item.supplyIntent?.farmer
        );

        const contributesToPool =
          item.supplyPool?.contributors?.some(
            (contributor) =>
              sameUser(contributor.farmer)
          ) || false;

        return ownsLot || ownsIntent || contributesToPool;
      });
    } else if (
      req.user.role === "fpo" ||
      req.user.role === "arthiya"
    ) {
      commitments = commitments.filter((item) => {
        const managesLot =
          item.lot?.aggregatorType === req.user.role &&
          sameUser(item.lot?.aggregator);

        const managesIntent =
          item.supplyIntent?.aggregatorType ===
          req.user.role &&
          sameUser(item.supplyIntent?.aggregator);

        const managesPool =
          item.supplyPool?.aggregatorType ===
          req.user.role &&
          sameUser(item.supplyPool?.aggregator);

        return managesLot || managesIntent || managesPool;
      });
    } else if (req.user.role !== "admin") {
      commitments = [];
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
    console.error("Get commitments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve commitments",
    });
  }
};


module.exports = {
  createCommitment,
  cancelCommitment,
  getCommitmentById,
  getCommitments,
};