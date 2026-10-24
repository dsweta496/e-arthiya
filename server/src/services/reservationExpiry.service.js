const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const PurchaseCommitment = require("../models/PurchaseCommitment");
const { recordBlockchainAnchor } = require("./blockchainAnchor.service");

// Reservation is a holding state, not a commitment. If the farmer does not
// declare the advance received/create the commitment within the window, release
// only sources that are still reserved and have no active commitment.
const DAY = 24 * 60 * 60 * 1000;
let running = false;

async function expireReservedSources() {
  if (running) return;
  running = true;
  try {
    const now = Date.now();
    const rules = [
      { Model: ProduceLot, sourceType: "lot", days: 7, dateField: "updatedAt" },
      { Model: SupplyIntent, sourceType: "supply_intent", days: 30, dateField: "updatedAt" },
    ];

    for (const rule of rules) {
      const cutoff = new Date(now - rule.days * DAY);
      const stale = await rule.Model.find({ status: "reserved", [rule.dateField]: { $lte: cutoff } }).select("_id farmer").lean();
      for (const source of stale) {
        const linked = rule.sourceType === "lot"
          ? { lot: source._id }
          : { supplyIntent: source._id };
        const active = await PurchaseCommitment.findOne({
          ...linked,
          status: { $nin: ["cancelled", "defaulted", "expired", "reallocated", "spot_rerouted", "flash_sale"] },
        }).select("_id").lean();
        if (active) continue;

        const released = await rule.Model.findOneAndUpdate(
          { _id: source._id, status: "reserved", updatedAt: { $lte: cutoff } },
          { $set: { status: "available" } },
          { new: true }
        );
        if (!released) continue;

        try {
          await recordBlockchainAnchor({
            entityType: rule.sourceType === "lot" ? "lot" : "supply_intent",
            entityId: released._id,
            eventType: "RESERVATION_EXPIRED_RELEASED",
            payload: { sourceType: rule.sourceType, sourceId: String(released._id), status: "available", reservationWindowDays: rule.days },
            recordedBy: source.farmer,
          });
        } catch (anchorError) {
          // The database state is authoritative for this MVP; log anchor failure.
          console.error("Reservation expiry anchor failed:", anchorError.message);
        }
        console.log(`Released expired ${rule.sourceType} ${released._id} to available`);
      }
    }
  } catch (error) {
    console.error("Reservation expiry check failed:", error.message);
  } finally {
    running = false;
  }
}

function startReservationExpiryJob() {
  // Run once on startup and every minute afterwards.
  expireReservedSources();
  const timer = setInterval(expireReservedSources, 60 * 1000);
  if (typeof timer.unref === "function") timer.unref();
}

module.exports = { expireReservedSources, startReservationExpiryJob };
