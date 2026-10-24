const { recordBlockchainAnchor } = require("../services/blockchainAnchor.service");
const PurchaseCommitment =
  require("../models/PurchaseCommitment");

const Auction = require("../models/Auction");

const Bid = require("../models/Bid");

const ExternalOffer =
  require("../models/ExternalOffer");

const ProduceLot =
  require("../models/ProduceLot");
const Notification = require("../models/Notification");
const Allocation = require("../models/Allocation");

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
        commitmentWindowEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        commitmentWindowEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      offer.status = "selected";
      await offer.save();
    }

    const commitment =
      await PurchaseCommitment.create(
        commitmentData
      );

    const blockchain = await recordBlockchainAnchor({ entityType: "commitment", entityId: commitment._id, eventType: "COMMITMENT_CREATED", payload: { commitmentId: String(commitment._id), source: commitment.source, agreedPrice: commitment.agreedPrice, quantity: commitment.quantity, unit: commitment.unit, depositAmount: commitment.depositAmount, status: commitment.status }, recordedBy: req.user._id });
    res.status(201).json({
      success: true,
      message: "Purchase commitment created successfully",
      data: commitment,
      blockchain,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : (error.statusCode || 500);
    res.status(status).json({ success: false, message: status === 409 ? "A commitment already exists for this auction" : (error.message || "Unable to create commitment") });
  }
};

const cancelCommitment = async (req, res) => {
  try {
    const commitment = await PurchaseCommitment.findById(req.params.id);
    if (!commitment) return res.status(404).json({ success: false, message: "Purchase commitment not found" });
    if (!commitment.buyer || commitment.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the buyer who owns this commitment can withdraw it" });
    }
    if (commitment.status !== "pending_deposit") {
      return res.status(409).json({ success: false, message: "Withdrawal is only allowed before the security deposit. After deposit, contact admin for review." });
    }

    const previousStatus = commitment.status;
    if (previousStatus === "pending_deposit") {
      commitment.status = "cancelled";
      commitment.failureReason = "Buyer withdrew before completing the security deposit";
      commitment.reroutingStatus = "not_required";
      // The demo has not collected a deposit yet. Return the lot to reserved (not available)
      // because its auction outcome still exists; do not make it publicly available implicitly.
      if (commitment.lot) {
        await ProduceLot.findOneAndUpdate({ _id: commitment.lot, status: "committed" }, { $set: { status: "reserved" } });
      }
    } else {
      commitment.status = "defaulted";
      commitment.failureReason = "Buyer withdrew after commitment confirmation";
      commitment.reroutingStatus = "pending";
    }
    await commitment.save();
    const blockchain = await recordBlockchainAnchor({ entityType: "commitment", entityId: commitment._id, eventType: "COMMITMENT_WITHDRAWN", payload: { commitmentId: String(commitment._id), previousStatus, status: commitment.status, reroutingStatus: commitment.reroutingStatus }, recordedBy: req.user._id });

    return res.status(200).json({
      success: true,
      message: previousStatus === "pending_deposit"
        ? "Commitment withdrawn before deposit; no refund is due"
        : "Commitment marked as defaulted and queued for rerouting; any refund requires review",
      data: commitment,
      blockchain,
    });
  } catch (error) {
    console.error("Withdraw commitment error:", error);
    return res.status(500).json({ success: false, message: "Unable to withdraw commitment" });
  }
};


const approveCommitmentAfterDeposit = async (req, res) => {
  try {
    const commitment = await PurchaseCommitment.findById(req.params.id);
    if (!commitment) return res.status(404).json({ success: false, message: "Purchase commitment not found" });
    let lot = commitment.lot ? await ProduceLot.findById(commitment.lot) : null;
    let farmerId = lot?.farmer;
    if (!farmerId && commitment.supplyIntent) farmerId = (await require("../models/SupplyIntent").findById(commitment.supplyIntent).select("farmer"))?.farmer;
    if (!farmerId && commitment.supplyPool) {
      const pool = await require("../models/SupplyPool").findById(commitment.supplyPool).select("aggregator");
      farmerId = pool?.aggregator;
    }
    if (req.user.role !== "admin" && (!farmerId || String(farmerId) !== String(req.user._id))) return res.status(403).json({ success: false, message: "Only the supplying farmer (or admin) can approve this commitment" });
    if (commitment.status !== "pending_farmer_approval") return res.status(409).json({ success: false, message: "Commitment is not awaiting farmer approval" });
    commitment.status = "confirmed";
    await commitment.save();
    if (lot) { lot.status = "committed"; await lot.save(); }
    await Notification.create({ recipient: commitment.buyer, type: "commitment_approved", title: "Commitment approved", message: "The supplying farmer approved your commitment after deposit.", entityType: "commitment", entityId: String(commitment._id) });
    const blockchain = await recordBlockchainAnchor({ entityType: "commitment", entityId: commitment._id, eventType: "COMMITMENT_CONFIRMED", payload: { commitmentId: String(commitment._id), status: commitment.status }, recordedBy: req.user._id });
    return res.json({ success: true, message: "Commitment approved", data: commitment, blockchain });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to approve commitment" }); }
};

// Farmers must see only their own contribution when a commitment is backed by an aggregated pool.
function farmerSafeCommitment(commitment, farmerId) {
  const raw = commitment?.toObject ? commitment.toObject() : { ...commitment };
  const pool = raw.supplyPool;
  if (!pool || !Array.isArray(pool.contributors)) return raw;
  const ownId = String(farmerId);
  const own = pool.contributors.find((c) => String(c.farmer?._id || c.farmer) === ownId);
  if (!own) return raw;
  const shareQuantity = Number(own.quantity || 0);
  const parentTotal = Number(pool.totalQuantity || raw.quantity || 0);
  const ratio = parentTotal > 0 ? Math.min(1, shareQuantity / parentTotal) : 0;
  raw.quantity = shareQuantity;
  raw.depositAmount = Number((Number(raw.depositAmount || 0) * ratio).toFixed(2));
  if (raw.settlement && typeof raw.settlement === "object") {
    for (const key of ["cropValue", "farmerAmount", "serviceFee", "facilitatorCommission", "platformFee", "depositApplied"]) {
      if (raw.settlement[key] != null) raw.settlement[key] = Number((Number(raw.settlement[key]) * ratio).toFixed(2));
    }
  }
  raw.supplyPool = { _id: pool._id, crop: pool.crop, variety: pool.variety, unit: pool.unit, totalQuantity: shareQuantity, status: pool.status, contributors: [{ farmer: own.farmer?._id || own.farmer, quantity: shareQuantity, sourceType: own.sourceType, sourceId: own.sourceId }] };
  raw.farmerShareView = true;
  return raw;
}

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
        populate: [
          { path: "aggregator", select: "name phone role" },
          { path: "contributors.farmer", select: "name phone role" },
        ],
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
      sameUser(supplyPool?.aggregator) ||
      (req.user.role === "farmer" && supplyPool?.contributors?.some((c) => sameUser(c.farmer)));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this commitment",
      });
    }

    return res.status(200).json({
      success: true,
      data: req.user.role === "farmer" && supplyPool?.contributors?.some((c) => sameUser(c.farmer))
        ? farmerSafeCommitment(commitment, req.user._id)
        : commitment,
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

    if (req.user.role === "farmer") {
      commitments = commitments.map((item) => {
        if (item.supplyPool?.contributors?.some((c) => sameUser(c.farmer))) return farmerSafeCommitment(item, req.user._id);
        return item;
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
    console.error("Get commitments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve commitments",
    });
  }
};



// Farmer-side MVP action: a farmer may create a commitment for their own reserved source
// after manually declaring that the agreed deposit was received. This does NOT move money.

const createCommitmentFromReservedSupply = async (req, res) => {
  let createdCommitment = null;
  let source = null;
  let sourceType = null;

  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Only the supplying farmer can use this action",
      });
    }

    const {
      sourceType: requestedSourceType,
      sourceId,
      auctionId,
      agreedPrice,
      externalBuyerName,
      paymentReceived,
    } = req.body || {};

    sourceType = requestedSourceType;

    if (!["lot", "supply_intent"].includes(sourceType) || !sourceId) {
      return res.status(400).json({
        success: false,
        message: "A valid reserved lot or future intent is required",
      });
    }

    const price = Number(agreedPrice);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Agreed price must be greater than zero",
      });
    }

    if (paymentReceived !== true) {
      return res.status(400).json({
        success: false,
        message: "Farmer confirmation that payment was received is required",
      });
    }

    const Source =
      sourceType === "lot"
        ? ProduceLot
        : require("../models/SupplyIntent");

    source = await Source.findById(sourceId);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Reserved supply source not found",
      });
    }

    if (String(source.farmer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "This supply source does not belong to you",
      });
    }

    if (source.status !== "reserved") {
      return res.status(409).json({
        success: false,
        message: "Only supply with reserved status can create a commitment",
      });
    }

    let auction = null;
    let allocation = null;
    let buyer = null;
    let externalName = String(externalBuyerName || "").trim();
    let sourceName = "direct_commitment";

    let quantity = Number(
      sourceType === "lot" ? source.quantity : source.expectedQuantity
    );
    let finalPrice = price;

    if (auctionId) {
      auction = await Auction.findById(auctionId)
        .populate("lot")
        .populate("highestBid")
        .populate("selectedExternalOffer");

      if (
        !auction ||
        String(auction.lot?._id || auction.lot) !== String(sourceId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Auction does not match this supply source",
        });
      }

      if (
        !["closed_platform_winner", "closed_external_offer"].includes(
          auction.status
        )
      ) {
        return res.status(409).json({
          success: false,
          message: "Auction must be closed with a selected outcome",
        });
      }

      const existingAuctionCommitment =
        await PurchaseCommitment.findOne({ auction: auction._id });

      if (existingAuctionCommitment) {
        return res.status(409).json({
          success: false,
          message: "A commitment already exists for this auction",
        });
      }

      if (auction.status === "closed_platform_winner") {
        if (!auction.highestBid?.buyer) {
          return res.status(409).json({
            success: false,
            message: "Winning buyer details are unavailable",
          });
        }

        buyer = auction.highestBid.buyer;
        finalPrice = Number(auction.highestBid.amount);
        sourceName = "platform_bid";
      } else {
        const offer = auction.selectedExternalOffer;

        if (!offer) {
          return res.status(409).json({
            success: false,
            message: "Selected external offer is unavailable",
          });
        }

        externalName = offer.buyerName;
        finalPrice = Number(offer.offeredAmount);
        sourceName = "external_offer";
      }

      quantity = Number(source.quantity);
    } else {
      allocation = await Allocation.findOne({
        sourceType,
        sourceId,
        status: "reserved",
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "procurementRequest",
          populate: {
            path: "buyer",
            select: "name phone role",
          },
        });

      if (allocation) {
        quantity = Number(allocation.allocatedQuantity);
        buyer =
          allocation.procurementRequest?.buyer?._id ||
          allocation.procurementRequest?.buyer ||
          null;

        if (buyer) sourceName = "direct_commitment";
      }
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid reserved quantity is required",
      });
    }

    if (!buyer && !externalName) {
      return res.status(400).json({
        success: false,
        message: "A buyer must be linked to this reserved supply or entered by name",
      });
    }

    const duplicateQuery = auction
      ? { auction: auction._id }
      : {
          [sourceType === "lot" ? "lot" : "supplyIntent"]: source._id,
          status: {
            $nin: [
              "cancelled",
              "defaulted",
              "reallocated",
              "spot_rerouted",
              "flash_sale",
            ],
          },
        };

    const duplicate = await PurchaseCommitment.findOne(duplicateQuery);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A commitment already exists for this reserved supply",
      });
    }

    const total = Math.round(finalPrice * quantity * 100) / 100;

    const commitmentData = {
      ...(auction ? { auction: auction._id } : {}),
      ...(sourceType === "lot"
        ? { lot: source._id }
        : { supplyIntent: source._id }),
      source: sourceName,
      buyer: buyer || null,
      externalBuyerName: buyer ? null : externalName,
      agreedPrice: finalPrice,
      quantity,
      unit: source.unit,
      depositPercentage: 50,
      depositAmount: Math.round(total * 50) / 100,
      status: "confirmed",
      commitmentWindowEndsAt: new Date(
        Date.now() +
          (sourceType === "lot" ? 7 : 30) * 24 * 60 * 60 * 1000
      ),
    };

    createdCommitment =
      await PurchaseCommitment.create(commitmentData);

    // Anchor the commitment before marking the source committed.
    const blockchain = await recordBlockchainAnchor({
      entityType: "commitment",
      entityId: createdCommitment._id,
      eventType: "COMMITMENT_CREATED_PAYMENT_REPORTED",
      payload: {
        commitmentId: String(createdCommitment._id),
        sourceType,
        sourceId: String(source._id),
        status: createdCommitment.status,
        agreedPrice: finalPrice,
        quantity,
        unit: source.unit,
        depositAmount: createdCommitment.depositAmount,
        farmerReportedPaymentReceived: true,
        paymentVerified: false,
      },
      recordedBy: req.user._id,
    });

    // Atomically transition reserved supply to committed.
    const committedSource = await Source.findOneAndUpdate(
      { _id: source._id, status: "reserved" },
      { $set: { status: "committed" } },
      { new: true, runValidators: true }
    );

    if (!committedSource) {
      return res.status(409).json({
        success: false,
        message:
          "The commitment was created and anchored, but the supply status changed concurrently. Refresh and inspect the commitment before retrying.",
        data: createdCommitment,
        blockchain,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Commitment created and anchored. Supply is now committed. Payment receipt is a farmer declaration only; no money was transferred or independently verified.",
      data: createdCommitment,
      blockchain,
      paymentNotice:
        "MANUAL DECLARATION ONLY — no payment transaction was created.",
    });
  } catch (error) {
    console.error("Create commitment from reserved supply error:", error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "A commitment already exists"
          : error.message ||
            "Unable to create commitment from reserved supply",
      ...(createdCommitment
        ? { commitmentId: String(createdCommitment._id) }
        : {}),
    });
  }
};


module.exports = {
  createCommitment,
  cancelCommitment,
  approveCommitmentAfterDeposit,
  getCommitmentById,
  getCommitments,
  createCommitmentFromReservedSupply,
};