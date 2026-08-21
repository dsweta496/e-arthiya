const Bid = require("../models/Bid");
const Auction = require("../models/Auction");
const User = require("../models/User");

const createBid = async (req, res) => {
  try {
    const { buyer, amount } = req.body;

    if (!buyer || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Buyer and amount are required",
      });
    }

    const auction = await Auction.findById(
      req.params.id
    );

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

    const buyerUser = await User.findById(buyer);

    if (!buyerUser) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    if (buyerUser.role !== "buyer") {
      return res.status(400).json({
        success: false,
        message: "Only buyers can place bids",
      });
    }

    if (buyerUser.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Buyer is not verified",
      });
    }

    if (amount <= auction.currentHighestBid) {
      return res.status(400).json({
        success: false,
        message:
          "Bid must be higher than the current highest bid",
      });
    }

    const bid = await Bid.create({
      auction: auction._id,
      buyer,
      amount,
    });

    if (auction.highestBid) {
      await Bid.findByIdAndUpdate(
        auction.highestBid,
        {
          status: "active",
        }
      );
    }

    bid.status = "winning";
    await bid.save();

    auction.currentHighestBid = amount;
    auction.highestBid = bid._id;

    await auction.save();

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAuctionBids = async (req, res) => {
  try {
    const bids = await Bid.find({
      auction: req.params.id,
    })
      .populate("buyer", "name phone")
      .sort({ amount: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBid,
  getAuctionBids,
};