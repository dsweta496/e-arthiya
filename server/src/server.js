const app = require("./app");
const connectDB = require("./config/db");
const { startReservationExpiryJob } = require("./services/reservationExpiry.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startReservationExpiryJob();
  });
};

startServer();