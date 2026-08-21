const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const userRoutes = require("./routes/user.routes");
const lotRoutes = require("./routes/lot.routes");
const auctionRoutes = require("./routes/auction.routes");
const commitmentRoutes = require("./routes/commitment.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/lots", lotRoutes);
app.use("/api/auctions", auctionRoutes);
app.use(
  "/api/commitments",
  commitmentRoutes
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "e-Arthiya API is running",
  });
});

module.exports = app;