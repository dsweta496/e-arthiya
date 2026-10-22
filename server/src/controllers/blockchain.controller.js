const { anchorTradeEvent, getAnchorStatus } = require("../services/blockchain.service");

async function anchorTradeEventController(req, res) {
  try {
    const result = await anchorTradeEvent(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 502;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to anchor event on blockchain.",
    });
  }
}

async function getAnchorStatusController(req, res) {
  try {
    const result = await getAnchorStatus(req.params.eventId);
    return res.json({ success: true, ...result });
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 502;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to read blockchain event status.",
    });
  }
}

module.exports = { anchorTradeEventController, getAnchorStatusController };
