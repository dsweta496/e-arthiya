const Auction = require("../models/Auction");
const ProduceLot = require("../models/ProduceLot");
const Bid = require("../models/Bid");
const { getAvailableQuantity } = require("../services/allocation.service");

function canManageLot(user, lot) {
  if (!user || !lot) return false;
  if (user.role === "admin") return true;
  if (user.role === "farmer") {
    return lot.farmer.toString() === user._id.toString();
  }
  if (["fpo", "arthiya"].includes(user.role)) {
    return (
      lot.aggregator &&
      lot.aggregator.toString() === user._id.toString() &&
      lot.aggregatorType === user.role
    );
  }
  return false;
}

const createAuction = async (req, res) => {
  try {
    const { lot, startTime, endTime, startingPrice } = req.body;

    if (!lot || !startTime || !endTime || startingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Lot, start time, end time and starting price are required",
      });
    }

    const lotData = await ProduceLot.findById(lot);

    if (!lotData) {
      return res.status(404).json({
        success: false,
        message: "Produce lot not found",
      });
    }

    if (!canManageLot(req.user, lotData)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to auction this lot",
      });
    }

    if (["reserved", "committed", "sold", "cancelled"].includes(lotData.status)) {
      return res.status(400).json({
        success: false,
        message: "This lot is no longer available",
      });
    }

    const availability = await getAvailableQuantity("lot", lot);

    if (availability.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "This lot has no unallocated quantity available for auction",
      });
    }

    const existingAuction = await Auction.findOne({ lot });

    if (existingAuction) {
      return res.status(409).json({
        success: false,
        message: "An auction already exists for this lot",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid auction dates",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const auction = await Auction.create({
      lot,
      startTime: start,
      endTime: end,
      startingPrice,
      currentHighestBid: startingPrice,
      status: "open",
    });

    lotData.status = "in_auction";
    await lotData.save();

    return res.status(201).json({
      success: true,
      message: "Auction created successfully",
      data: auction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAuctions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    if (["farmer", "fpo", "arthiya"].includes(req.user.role)) {
      const lotFilter = {};

      if (req.user.role === "farmer") {
        lotFilter.farmer = req.user._id;
      } else {
        lotFilter.aggregator = req.user._id;
        lotFilter.aggregatorType = req.user.role;
      }

      const managedLots = await ProduceLot.find(lotFilter).select("_id");
      filter.lot = { $in: managedLots.map((item) => item._id) };
    }

    const auctions = await Auction.find(filter)
      .populate("lot")
      .populate("highestBid")
      .populate("selectedExternalOffer")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: auctions.length,
      data: auctions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("lot")
      .populate("highestBid")
      .populate("selectedExternalOffer");

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    if (["farmer", "fpo", "arthiya"].includes(req.user.role)) {
      if (!canManageLot(req.user, auction.lot)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this auction",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: auction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const closeAuction = async (req, res) => {
  try {
    const { result } = req.body;

    const auction = await Auction.findById(req.params.id).populate("lot");

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    if (!canManageLot(req.user, auction.lot)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to close this auction",
      });
    }

    if (auction.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Auction is not open",
      });
    }

    if (!["platform_winner", "external_offer"].includes(result)) {
      return res.status(400).json({
        success: false,
        message: "Result must be platform_winner or external_offer",
      });
    }

    if (result === "platform_winner" && !auction.highestBid) {
      return res.status(400).json({
        success: false,
        message: "No platform bid exists",
      });
    }

    if (result === "external_offer" && !auction.selectedExternalOffer) {
      return res.status(400).json({
        success: false,
        message: "No external offer has been selected",
      });
    }

    auction.status =
      result === "platform_winner"
        ? "closed_platform_winner"
        : "closed_external_offer";
    auction.closedAt = new Date();

    await auction.save();

    if (result === "platform_winner") {
      await Bid.updateMany(
        {
          auction: auction._id,
          _id: { $ne: auction.highestBid },
          status: "active",
        },
        { status: "rejected" }
      );
    } else {
      await Bid.updateMany(
        {
          auction: auction._id,
          status: { $in: ["active", "winning"] },
        },
        { status: "rejected" }
      );
    }

    await ProduceLot.findByIdAndUpdate(auction.lot._id, {
      status: "reserved",
    });

    return res.status(200).json({
      success: true,
      message: "Auction closed successfully",
      data: auction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  closeAuction,
};
