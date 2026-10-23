const mongoose = require("mongoose");
const PaymentTransaction = require("../models/PaymentTransaction");
const PurchaseCommitment = require("../models/PurchaseCommitment");
const ProduceLot = require("../models/ProduceLot");
const { recordBlockchainAnchor } = require("../services/blockchainAnchor.service");
const FarmerPayout = require("../models/FarmerPayout");
const Notification = require("../models/Notification");

function sameId(a, b) { return a && b && String(a._id || a) === String(b._id || b); }
function money(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function apiError(res, status, message) { return res.status(status).json({ success: false, message }); }

async function createDepositPayment(req, res) {
  const { commitmentId } = req.params;
  if (!mongoose.isValidObjectId(commitmentId)) return apiError(res, 400, "Invalid commitment ID");
  const session = await mongoose.startSession();
  let payment, commitment;
  try {
    await session.withTransaction(async () => {
      commitment = await PurchaseCommitment.findById(commitmentId).session(session);
      if (!commitment) { const e = new Error("Purchase commitment not found"); e.statusCode = 404; throw e; }
      if (!sameId(commitment.buyer, req.user._id)) { const e = new Error("You are not authorized to make this payment"); e.statusCode = 403; throw e; }
      if (commitment.status !== "pending_deposit") { const e = new Error("Security deposit is not payable in the current commitment state"); e.statusCode = 409; throw e; }
      const amount = money(commitment.depositAmount);
      if (!Number.isFinite(amount) || amount <= 0) { const e = new Error("Invalid deposit amount configured for this commitment"); e.statusCode = 400; throw e; }
      const key = `deposit:${commitment._id}`;
      const existing = await PaymentTransaction.findOne({ idempotencyKey: key }).session(session);
      if (existing) {
        if (existing.status === "completed") { const e = new Error("Security deposit has already been completed"); e.statusCode = 409; throw e; }
        payment = existing;
      } else {
        [payment] = await PaymentTransaction.create([{
          commitment: commitment._id, payer: req.user._id, type: "security_deposit", amount,
          currency: "INR", status: "completed", paymentMethod: "demo",
          transactionReference: `DEMO-DEP-${commitment._id}`, idempotencyKey: key, paidAt: new Date(),
        }], { session });
      }
      commitment.status = "pending_farmer_approval";
      await commitment.save({ session });
      // Supply remains uncommitted until the farmer approves the deposited commitment.
    });
    const blockchain = await recordBlockchainAnchor({ entityType: "payment", entityId: payment._id, eventType: "DEPOSIT_RECORDED", payload: { paymentId: String(payment._id), commitmentId: String(commitment._id), amount: payment.amount, currency: payment.currency, paymentStatus: payment.status, commitmentStatus: commitment.status, paymentMethod: "demo" }, recordedBy: req.user._id });
    try {
      if (blockchain.anchor?.transactionHash) {
        payment.blockchainTxHash = blockchain.anchor.transactionHash;
        await payment.save();
        commitment.blockchainTxHash = blockchain.anchor.transactionHash;
        await commitment.save();
      }
    } catch (metadataError) {
      // The payment transaction is already committed in MongoDB. Do not report the
      // payment itself as failed because optional proof metadata could not be saved.
      console.error("Could not persist deposit proof metadata:", metadataError.message);
    }
    // Notify the supplying farmer that a deposit was recorded and approval is needed.
    const sourceFarmer = commitment.lot ? (await ProduceLot.findById(commitment.lot).select("farmer"))?.farmer : null;
    if (sourceFarmer) await Notification.create({ recipient: sourceFarmer, type: "commitment_awaiting_approval", title: "Commitment awaiting approval", message: "A buyer has recorded the demo deposit. Review and approve the commitment.", entityType: "commitment", entityId: String(commitment._id) });
    // A separate commitment event makes the state transition independently discoverable.
    const commitmentProof = await recordBlockchainAnchor({ entityType: "commitment", entityId: commitment._id, eventType: "COMMITMENT_AWAITING_FARMER_APPROVAL", payload: { commitmentId: String(commitment._id), status: commitment.status, depositPaymentId: String(payment._id), depositAmount: payment.amount }, recordedBy: req.user._id });
    return res.status(201).json({ success: true, message: "Demo deposit recorded; awaiting farmer approval", data: { payment, commitment }, blockchain, commitmentProof, paymentNotice: "DEMO PAYMENT ONLY: no real money was transferred." });
  } catch (error) {
    console.error("Create deposit payment error:", error);
    return apiError(res, error.statusCode || 500, error.message || "Unable to record deposit");
  } finally { await session.endSession(); }
}

async function createBalancePayment(req, res) {
  const { commitmentId } = req.params;
  if (!mongoose.isValidObjectId(commitmentId)) return apiError(res, 400, "Invalid commitment ID");
  const session = await mongoose.startSession();
  let payment, commitment;
  try {
    await session.withTransaction(async () => {
      commitment = await PurchaseCommitment.findById(commitmentId).session(session);
      if (!commitment) { const e = new Error("Purchase commitment not found"); e.statusCode = 404; throw e; }
      if (!sameId(commitment.buyer, req.user._id)) { const e = new Error("Only the commitment buyer can pay the balance"); e.statusCode = 403; throw e; }
      if (!["confirmed", "active"].includes(commitment.status)) { const e = new Error("Balance payment requires a confirmed or active commitment"); e.statusCode = 409; throw e; }
      const total = money(Number(commitment.agreedPrice) * Number(commitment.quantity));
      const deposit = money(Number(commitment.depositAmount || 0));
      const amount = money(total - deposit);
      if (!Number.isFinite(total) || total <= 0 || amount < 0) { const e = new Error("Commitment total or deposit amount is invalid"); e.statusCode = 400; throw e; }
      if (amount === 0) { const e = new Error("No balance remains after deposit"); e.statusCode = 409; throw e; }
      const key = `balance:${commitment._id}`;
      const existing = await PaymentTransaction.findOne({ idempotencyKey: key }).session(session);
      if (existing?.status === "completed") { const e = new Error("Balance payment has already been completed"); e.statusCode = 409; throw e; }
      [payment] = await PaymentTransaction.create([{
        commitment: commitment._id, payer: req.user._id, type: "balance_payment", amount, currency: "INR",
        status: "completed", paymentMethod: "demo", transactionReference: `DEMO-BAL-${commitment._id}`,
        idempotencyKey: key, paidAt: new Date(),
      }], { session });
      commitment.status = "settled";
      const facilitatorRate = Number(process.env.FACILITATOR_COMMISSION_PERCENT || 0);
      const platformRate = Number(process.env.PLATFORM_FEE_PERCENT || 0);
      if (![facilitatorRate, platformRate].every((v) => Number.isFinite(v) && v >= 0 && v <= 100) || facilitatorRate + platformRate > 100) {
        const e = new Error("FACILITATOR_COMMISSION_PERCENT and PLATFORM_FEE_PERCENT must be valid percentages totaling no more than 100"); e.statusCode = 500; throw e;
      }
      const facilitatorCommission = money(total * facilitatorRate / 100);
      const platformFee = money(total * platformRate / 100);
      const serviceFee = money(facilitatorCommission + platformFee);
      commitment.settlement = {
        ...(commitment.settlement?.toObject ? commitment.settlement.toObject() : commitment.settlement || {}),
        cropValue: total, depositApplied: deposit, farmerAmount: money(total - serviceFee),
        serviceFee, facilitatorCommission, platformFee, settledAt: new Date(),
      };
      await commitment.save({ session });
    });
    // Ledger entry only; this does not transfer funds to a bank account.
    if (commitment.settlement?.farmerAmount > 0) {
      await FarmerPayout.findOneAndUpdate(
        { commitment: commitment._id },
        { $setOnInsert: { commitment: commitment._id, farmer: commitment.lot ? (await ProduceLot.findById(commitment.lot).select("farmer")).farmer : null, amount: commitment.settlement.farmerAmount, currency: "INR", status: "pending", sourcePayment: payment._id } },
        { upsert: true, new: true, runValidators: true }
      );
    }
    const blockchain = await recordBlockchainAnchor({ entityType: "payment", entityId: payment._id, eventType: "BALANCE_PAYMENT_RECORDED", payload: { paymentId: String(payment._id), commitmentId: String(commitment._id), amount: payment.amount, currency: payment.currency, paymentStatus: payment.status, commitmentStatus: commitment.status, paymentMethod: "demo" }, recordedBy: req.user._id });
    try { if (blockchain.anchor?.transactionHash) { payment.blockchainTxHash = blockchain.anchor.transactionHash; await payment.save(); } }
    catch (metadataError) { console.error("Could not persist balance proof metadata:", metadataError.message); }
    return res.status(201).json({ success: true, message: "Demo balance payment recorded and commitment settled", data: { payment, commitment }, blockchain, paymentNotice: "DEMO PAYMENT ONLY: no real money was transferred." });
  } catch (error) {
    console.error("Create balance payment error:", error);
    return apiError(res, error.statusCode || 500, error.message || "Unable to record balance payment");
  } finally { await session.endSession(); }
}

// Admin-only full refund for a completed demo payment after a commitment has been withdrawn/defaulted.
async function createRefundPayment(req, res) {
  const { paymentId } = req.params;
  if (!mongoose.isValidObjectId(paymentId)) return apiError(res, 400, "Invalid payment ID");
  const session = await mongoose.startSession();
  let refund, original, commitment;
  try {
    await session.withTransaction(async () => {
      original = await PaymentTransaction.findById(paymentId).session(session);
      if (!original) { const e = new Error("Payment transaction not found"); e.statusCode = 404; throw e; }
      if (original.status !== "completed" || original.type === "refund") { const e = new Error("Only a completed non-refund payment can be refunded"); e.statusCode = 409; throw e; }
      commitment = await PurchaseCommitment.findById(original.commitment).session(session);
      if (!commitment || !["defaulted", "cancelled"].includes(commitment.status)) { const e = new Error("Refund requires a cancelled or defaulted commitment"); e.statusCode = 409; throw e; }
      const key = `refund:${original._id}`;
      const existing = await PaymentTransaction.findOne({ idempotencyKey: key }).session(session);
      if (existing) { const e = new Error("A refund has already been recorded for this payment"); e.statusCode = 409; throw e; }
      [refund] = await PaymentTransaction.create([{
        commitment: original.commitment, payer: req.user._id, receiver: original.payer,
        type: "refund", amount: original.amount, currency: original.currency, status: "completed",
        paymentMethod: "demo", transactionReference: `DEMO-REF-${original._id}`, idempotencyKey: key, paidAt: new Date(),
      }], { session });
      original.status = "refunded";
      await original.save({ session });
    });
    const blockchain = await recordBlockchainAnchor({ entityType: "payment", entityId: refund._id, eventType: "PAYMENT_REFUNDED", payload: { refundPaymentId: String(refund._id), originalPaymentId: String(original._id), commitmentId: String(commitment._id), amount: refund.amount, currency: refund.currency, status: refund.status, paymentMethod: "demo" }, recordedBy: req.user._id });
    try { if (blockchain.anchor?.transactionHash) { refund.blockchainTxHash = blockchain.anchor.transactionHash; await refund.save(); } }
    catch (metadataError) { console.error("Could not persist refund proof metadata:", metadataError.message); }
    return res.status(201).json({ success: true, message: "Demo refund recorded", data: { refund, originalPayment: original, commitment }, blockchain, paymentNotice: "DEMO REFUND RECORD ONLY: no real money was transferred." });
  } catch (error) {
    console.error("Create refund error:", error);
    return apiError(res, error.statusCode || 500, error.message || "Unable to record refund");
  } finally { await session.endSession(); }
}

async function getPaymentById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return apiError(res, 400, "Invalid payment ID");
    const payment = await PaymentTransaction.findById(req.params.id)
      .populate("payer", "name phone role").populate("receiver", "name phone role")
      .populate({ path: "commitment", populate: [ { path: "buyer", select: "name phone role" }, { path: "lot", populate: [ { path: "farmer", select: "name phone role" }, { path: "aggregator", select: "name phone role" } ] }, { path: "supplyPool", populate: { path: "aggregator", select: "name phone role" } } ] });
    if (!payment) return apiError(res, 404, "Payment transaction not found");
    const commitment = payment.commitment, lot = commitment?.lot, pool = commitment?.supplyPool;
    const allowed = req.user.role === "admin" || sameId(payment.payer, req.user._id) || sameId(payment.receiver, req.user._id) || sameId(commitment?.buyer, req.user._id) || sameId(lot?.farmer, req.user._id) || sameId(lot?.aggregator, req.user._id) || sameId(pool?.aggregator, req.user._id);
    if (!allowed) return apiError(res, 403, "You are not authorized to view this payment");
    return res.json({ success: true, data: payment });
  } catch (error) { console.error("Get payment by ID error:", error); return apiError(res, 500, "Unable to retrieve payment transaction"); }
}

async function getPayments(req, res) {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    let payments = await PaymentTransaction.find(query).populate({ path: "commitment", populate: [ { path: "buyer", select: "name phone" }, { path: "lot", populate: { path: "farmer aggregator", select: "name phone role" } }, { path: "supplyPool", populate: { path: "aggregator", select: "name phone role" } } ] }).sort({ createdAt: -1 });
    if (req.user.role === "buyer") payments = payments.filter((item) => sameId(item.payer, req.user._id) || sameId(item.receiver, req.user._id) || sameId(item.commitment?.buyer, req.user._id));
    else if (["fpo", "arthiya"].includes(req.user.role)) payments = payments.filter((item) => sameId(item.commitment?.lot?.aggregator, req.user._id) || sameId(item.commitment?.supplyPool?.aggregator, req.user._id));
    else if (req.user.role === "farmer") payments = payments.filter((item) => sameId(item.commitment?.lot?.farmer, req.user._id));
    else if (req.user.role !== "admin") payments = [];
    return res.json({ success: true, count: payments.length, data: payments });
  } catch (error) { return apiError(res, 500, error.message || "Unable to retrieve payments"); }
}

module.exports = { createDepositPayment, createBalancePayment, createRefundPayment, getPaymentById, getPayments };
