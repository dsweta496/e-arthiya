const Bid = require("../models/Bid");
const Auction = require("../models/Auction");
const User = require("../models/User");

const createBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const buyer = req.user._id;

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "A valid bid amount is required" });
    }

    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });

    if (auction.status !== "open") {
      return res.status(400).json({ success: false, message: "Auction is not open" });
    }

    if (auction.endTime && new Date(auction.endTime) <= new Date()) {
      return res.status(400).json({ success: false, message: "Auction has ended" });
    }

    const buyerUser = await User.findById(buyer);
    if (!buyerUser || buyerUser.role !== "buyer") {
      return res.status(403).json({ success: false, message: "Only buyers can place bids" });
    }

    if (buyerUser.verificationStatus !== "verified") {
      return res.status(403).json({ success: false, message: "Buyer is not verified" });
    }

    if (Number(amount) <= Number(auction.currentHighestBid || auction.startingPrice || 0)) {
      return res.status(400).json({
        success: false,
        message: "Bid must be higher than the current highest bid",
      });
    }

    const bid = await Bid.create({
      auction: auction._id,
      buyer,
      amount: Number(amount),
      status: "winning",
    });

    if (auction.highestBid) {
      await Bid.findByIdAndUpdate(auction.highestBid, { status: "active" });
    }

    auction.currentHighestBid = Number(amount);
    auction.highestBid = bid._id;
    await auction.save();

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAuctionBids = async (req, res) => {
  try {
    const filter = { auction: req.params.id };

    // Buyers can see their own bids for an auction.
    // Farmer/FPO/Arthiya views can still see the full bid list.
    if (req.user.role === "buyer") {
      filter.buyer = req.user._id;
    }

    const bids = await Bid.find(filter)
      .populate("buyer", "name phone")
      .sort({ amount: -1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBid, getAuctionBids };
