const ProcurementRequest = require("../models/ProcurementRequest");

const {
  findMatches,
  matchProcurementRequest,
} = require("../services/matching.service");

// Preview possible matches
const getMatches = async (req, res) => {
  try {
    const { procurementRequestId } = req.params;

    const procurementRequest =
      await ProcurementRequest.findById(
        procurementRequestId
      );

    if (!procurementRequest) {
      return res.status(404).json({
        message: "Procurement request not found",
      });
    }

    // Buyers can only inspect their own requests.
    // FPOs and Arthiyas can inspect requests they are
    // facilitating.
    if (
      ["buyer"].includes(req.user.role) &&
      procurementRequest.buyer.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to view matches for this procurement request",
      });
    }

    const matches = await findMatches(
      procurementRequestId
    );

    return res.status(200).json({
      procurementRequestId,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Find matches error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Match demand and create allocations
const runMatching = async (req, res) => {
  try {
    const { procurementRequestId } = req.params;

    const procurementRequest =
      await ProcurementRequest.findById(
        procurementRequestId
      );

    if (!procurementRequest) {
      return res.status(404).json({
        message: "Procurement request not found",
      });
    }

    // Buyers can only run matching for their own demand.
    if (
      req.user.role === "buyer" &&
      procurementRequest.buyer.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to match this procurement request",
      });
    }

    const result =
      await matchProcurementRequest(
        procurementRequestId
      );

    return res.status(200).json({
      message: result.fullyMatched
        ? "Procurement request fully matched"
        : "Procurement request partially matched",
      ...result,
    });
  } catch (error) {
    console.error("Run matching error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  getMatches,
  runMatching,
};