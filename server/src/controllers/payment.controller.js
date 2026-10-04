const PaymentTransaction = require("../models/PaymentTransaction");
const PurchaseCommitment = require("../models/PurchaseCommitment");
const ProduceLot = require("../models/ProduceLot");

const createDepositPayment = async (req, res) => {
  try {
    const { commitmentId } = req.params;

    const commitment = await PurchaseCommitment.findById(
      commitmentId
    );

    if (!commitment) {
      return res.status(404).json({
        success: false,
        message: "Purchase commitment not found",
      });
    }

    // -----------------------------------------
    // BUYER OWNERSHIP CHECK
    // -----------------------------------------

    if (
      !commitment.buyer ||
      commitment.buyer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to make this payment",
      });
    }

    // -----------------------------------------
    // COMMITMENT STATE CHECK
    // -----------------------------------------

    if (commitment.status !== "pending_deposit") {
      return res.status(400).json({
        success: false,
        message:
          "Security deposit cannot be paid for this commitment in its current state",
      });
    }

    // -----------------------------------------
    // REQUIRED DEPOSIT
    // -----------------------------------------

    const requiredDeposit =
      commitment.depositAmount;

    if (!requiredDeposit || requiredDeposit <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid deposit amount configured for this commitment",
      });
    }

    // -----------------------------------------
    // PREVENT DUPLICATE COMPLETED DEPOSIT
    // -----------------------------------------

    const existingPayment =
      await PaymentTransaction.findOne({
        commitment: commitment._id,
        type: "security_deposit",
        status: "completed",
      });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message:
          "Security deposit has already been completed",
        data: existingPayment,
      });
    }

    // -----------------------------------------
    // DEMO PAYMENT
    // -----------------------------------------

    const payment =
      await PaymentTransaction.create({
        commitment: commitment._id,
        payer: req.user._id,
        type: "security_deposit",
        amount: requiredDeposit,
        currency: "INR",
        status: "completed",
        paymentMethod: "demo",
        transactionReference:
          `DEMO-DEP-${Date.now()}`,
        paidAt: new Date(),
      });

    // -----------------------------------------
    // CONFIRM COMMITMENT
    // -----------------------------------------

    commitment.status = "confirmed";

    await commitment.save();

    // -----------------------------------------
    // LOCK PHYSICAL SUPPLY
    // -----------------------------------------

    if (commitment.lot) {
      await ProduceLot.findByIdAndUpdate(
        commitment.lot,
        {
          status: "committed",
        }
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Security deposit completed and commitment confirmed",
      data: {
        payment,
        commitment,
      },
    });
  } catch (error) {
    console.error(
      "Create deposit payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment =
      await PaymentTransaction.findById(
        req.params.id
      )
        .populate(
          "payer",
          "name phone role"
        )
        .populate("receiver", "name phone role")
        .populate("commitment");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    if (
      payment.payer &&
      payment.payer._id.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this payment",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getPayments = async (req, res) => {
  try {
    const query = {};

    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    let payments = await PaymentTransaction.find(query)
      .populate({
        path: "commitment",
        populate: [
          { path: "buyer", select: "name phone" },
          { path: "lot", populate: { path: "aggregator", select: "name phone role" } },
          { path: "supplyPool", populate: { path: "aggregator", select: "name phone role" } },
        ],
      })
      .sort({ createdAt: -1 });

    if (req.user.role === "buyer") {
      payments = payments.filter(
        (item) =>
          item.payer &&
          item.payer.toString() === req.user._id.toString()
      );
    }

    if (req.user.role === "fpo" || req.user.role === "arthiya") {
      payments = payments.filter((item) => {
        const lotOwner =
          item.commitment?.lot?.aggregator &&
          item.commitment.lot.aggregator._id.toString() === req.user._id.toString();

        const poolOwner =
          item.commitment?.supplyPool?.aggregator &&
          item.commitment.supplyPool.aggregator._id.toString() === req.user._id.toString();

        return lotOwner || poolOwner;
      });
    }

    if (req.user.role === "farmer") {
      payments = payments.filter(
        (item) =>
          item.commitment?.lot?.farmer &&
          item.commitment.lot.farmer.toString() === req.user._id.toString()
      );
    }

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDepositPayment,
  getPaymentById,
  getPayments,
};