require("dotenv").config({
    path: "../.env",
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");

const User = require("../models/User");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const ProcurementRequest = require("../models/ProcurementRequest");

const seedMatchingDemo = async () => {
    try {
        await connectDB();

        console.log("Connected to MongoDB");

        // --------------------------------------------------
        // 1. CREATE / REUSE DEMO FARMER
        // --------------------------------------------------

        let farmer = await User.findOne({
            phone: "9000000001",
        });

        if (!farmer) {
            const passwordHash = await bcrypt.hash("demo123456", 12);

            farmer = await User.create({
                name: "Demo Farmer",
                phone: "9000000001",
                passwordHash,
                role: "farmer",
                verificationStatus: "verified",
                location: {
                    state: "Delhi",
                    district: "North Delhi",
                    village: "Demo Village",
                },
            });

            console.log("Created demo farmer");
        } else {
            console.log("Demo farmer already exists");
        }

        // --------------------------------------------------
        // 2. CREATE / REUSE DEMO BUYER
        // --------------------------------------------------

        let buyer = await User.findOne({
            phone: "9000000002",
        });

        if (!buyer) {
            const passwordHash = await bcrypt.hash("demo123456", 12);

            buyer = await User.create({
                name: "Demo Buyer",
                phone: "9000000002",
                passwordHash,
                role: "buyer",
                verificationStatus: "verified",
                location: {
                    state: "Delhi",
                    district: "New Delhi",
                },
            });

            console.log("Created demo buyer");
        } else {
            console.log("Demo buyer already exists");
        }

        // --------------------------------------------------
        // 3. CREATE DEMO SPOT LOT
        // --------------------------------------------------

        let lot = await ProduceLot.findOne({
            farmer: farmer._id,
            crop: "Tomato",
            variety: "Hybrid",
            quantity: 20,
        });

        if (!lot) {
            lot = await ProduceLot.create({
                farmer: farmer._id,
                crop: "Tomato",
                variety: "Hybrid",
                quantity: 20,
                unit: "quintal",
                status: "available",
                availableFrom: new Date(),
            });

            console.log("Created 20q Tomato spot lot");
        } else {
            console.log("Demo spot lot already exists");
        }

        // --------------------------------------------------
        // 4. CREATE DEMO FUTURE SUPPLY INTENT
        // --------------------------------------------------

        let supplyIntent = await SupplyIntent.findOne({
            farmer: farmer._id,
            crop: "Tomato",
            variety: "Hybrid",
            expectedQuantity: 30,
        });

        if (!supplyIntent) {
            const harvestDate = new Date();
            harvestDate.setDate(harvestDate.getDate() + 10);

            supplyIntent = await SupplyIntent.create({
                farmer: farmer._id,
                crop: "Tomato",
                variety: "Hybrid",
                expectedQuantity: 30,
                unit: "quintal",
                expectedHarvestDate: harvestDate,
                supplyType: "preorder",
                qualityExpectation: "Standard",
                aggregatorType: "direct",
                status: "available",
            });

            console.log("Created 30q Tomato future supply intent");
        } else {
            console.log("Demo future supply intent already exists");
        }

        // --------------------------------------------------
        // 5. CREATE DEMO PROCUREMENT REQUEST
        // --------------------------------------------------

        let procurementRequest = await ProcurementRequest.findOne({
            buyer: buyer._id,
            crop: "Tomato",
            variety: "Hybrid",
            quantity: 15,
        });

        if (!procurementRequest) {
            const requiredBy = new Date();
            requiredBy.setDate(requiredBy.getDate() + 7);

            procurementRequest = await ProcurementRequest.create({
                buyer: buyer._id,
                crop: "Tomato",
                variety: "Hybrid",
                quantity: 15,
                unit: "quintal",
                availabilityFrom: new Date(),
                requiredBy,
                demandType: "spot",
                qualityRequirement: "Standard",
                status: "open",
            });

            console.log("Created 15q Tomato procurement request");
        } else {
            console.log("Demo procurement request already exists");
        }

        // --------------------------------------------------
        // SUMMARY
        // --------------------------------------------------

        console.log("\n========================================");
        console.log("MATCHING DEMO DATA READY");
        console.log("========================================");

        console.log("Farmer ID:", farmer._id.toString());
        console.log("Buyer ID:", buyer._id.toString());
        console.log("Spot Lot ID:", lot._id.toString());
        console.log("Supply Intent ID:", supplyIntent._id.toString());
        console.log(
            "Procurement Request ID:",
            procurementRequest._id.toString()
        );

        console.log("\nDemo credentials:");
        console.log("Farmer: 9000000001 / demo123456");
        console.log("Buyer : 9000000002 / demo123456");

        console.log("\nProcurement Request:");
        console.log("15 quintal Tomato Hybrid");

        console.log("\nAvailable supply:");
        console.log("20 quintal spot lot");
        console.log("30 quintal future supply");

        console.log("========================================\n");

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Seed matching demo error:", error);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedMatchingDemo();