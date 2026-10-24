const { recordBlockchainAnchor } = require("../services/blockchainAnchor.service");
const Auction = require("../models/Auction");
const ProduceLot = require("../models/ProduceLot");
const Bid = require("../models/Bid");
const ExternalOffer = require("../models/ExternalOffer");
const Allocation = require("../models/Allocation");
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

    if (lotData.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Only an available lot can be auctioned",
      });
    }

    // A lot cannot be listed in an auction while a buyer proposal or
    // quantity-consuming allocation is attached to it. This prevents the
    // same produce being promised through two competing workflows.
    const activeAllocation = await Allocation.exists({
      sourceType: "lot",
      sourceId: lotData._id,
      status: { $in: ["proposed", "reserved", "committed", "fulfilled"] },
    });
    if (activeAllocation) {
      return res.status(409).json({
        success: false,
        message: "This lot has a buyer proposal or active allocation. Resolve it before creating an auction.",
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

    const blockchain = await recordBlockchainAnchor({
      entityType: "auction",
      entityId: auction._id,
      eventType: "AUCTION_CREATED",
      payload: {
        auctionId: String(auction._id),
        lotId: String(auction.lot),
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
        startingPrice: auction.startingPrice,
        status: auction.status,
      },
      recordedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Auction created successfully",
      data: auction,
      blockchain,
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

const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate("lot");
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    if (!canManageLot(req.user, auction.lot)) return res.status(403).json({ success: false, message: "You are not authorized to edit this auction" });
    if (auction.status !== "open") return res.status(409).json({ success: false, message: "Only open auctions can be edited" });
    const [bid, offer] = await Promise.all([Bid.exists({ auction: auction._id }), ExternalOffer.exists({ auction: auction._id })]);
    if (bid || offer) return res.status(409).json({ success: false, message: "Auction cannot be edited after the first bid or external offer" });
    const allowed = ["startTime", "endTime", "startingPrice"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "No editable auction fields supplied" });
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);
    const start = updates.startTime || auction.startTime, end = updates.endTime || auction.endTime;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return res.status(400).json({ success: false, message: "Valid dates are required and end time must be after start time" });
    if (end <= new Date()) return res.status(400).json({ success: false, message: "The auction end time must be in the future. Extend the end date to reopen an expired auction." });
    if (updates.startingPrice !== undefined && (!Number.isFinite(Number(updates.startingPrice)) || Number(updates.startingPrice) < 0)) return res.status(400).json({ success: false, message: "Starting price must be non-negative" });
    Object.assign(auction, updates);
    if (updates.startingPrice !== undefined) auction.currentHighestBid = Number(updates.startingPrice);
    await auction.save();
    return res.json({ success: true, message: "Auction updated", data: auction });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to update auction" }); }
};

const cancelAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate("lot");
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    if (!canManageLot(req.user, auction.lot)) return res.status(403).json({ success: false, message: "You are not authorized to cancel this auction" });
    if (auction.status !== "open") return res.status(409).json({ success: false, message: "Only open auctions can be cancelled" });
    const [bid, offer] = await Promise.all([Bid.exists({ auction: auction._id }), ExternalOffer.exists({ auction: auction._id })]);
    if (bid || offer) return res.status(409).json({ success: false, message: "Auction cannot be cancelled after the first bid or external offer" });
    auction.status = "cancelled";
    await auction.save();
    if (auction.lot && auction.lot.status === "in_auction") { auction.lot.status = "available"; await auction.lot.save(); }
    const blockchain = await recordBlockchainAnchor({ entityType: "auction", entityId: auction._id, eventType: "AUCTION_CANCELLED", payload: { auctionId: String(auction._id), status: auction.status }, recordedBy: req.user._id });
    return res.json({ success: true, message: "Auction cancelled", data: auction, blockchain });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to cancel auction" }); }
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

    await ProduceLot.findByIdAndUpdate(auction.lot._id, { status: "reserved" });
    const blockchain = await recordBlockchainAnchor({ entityType: "auction", entityId: auction._id, eventType: "AUCTION_CLOSED", payload: { auctionId: String(auction._id), lotId: String(auction.lot._id), result, status: auction.status, winningBidId: auction.highestBid ? String(auction.highestBid) : null, selectedExternalOfferId: auction.selectedExternalOffer ? String(auction.selectedExternalOffer) : null, closedAt: auction.closedAt.toISOString() }, recordedBy: req.user._id });

    return res.status(200).json({
      success: true,
      message: "Auction closed successfully",
      data: auction,
      blockchain,
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
  updateAuction,
  cancelAuction,
};
