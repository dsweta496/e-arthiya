const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const lotRoutes = require("./routes/lot.routes");
const auctionRoutes = require("./routes/auction.routes");
const commitmentRoutes = require("./routes/commitment.routes");
const supplyIntentRoutes = require("./routes/supplyIntent.route");
const procurementRequestRoutes = require("./routes/procurementRequest.route");
const supplyPoolRoutes = require("./routes/supplyPool.route");
const allocationRoutes = require("./routes/allocation.routes");
const matchingRoutes = require("./routes/matching.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/lots", lotRoutes);
app.use("/api/auctions", auctionRoutes);
app.use(
  "/api/commitments",
  commitmentRoutes
);
app.use(
  "/api/supply-intents",
  supplyIntentRoutes
);
app.use(
  "/api/procurement-requests",
  procurementRequestRoutes
);

app.use(
  "/api/matching",
  matchingRoutes
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "e-Arthiya API is running",
  });
});

app.use("/api/supply-pools", supplyPoolRoutes);

module.exports = app;