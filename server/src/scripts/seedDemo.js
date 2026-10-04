const mongoose = require("mongoose");
require("dotenv").config({
    path: require("path").resolve(__dirname, "../../../.env"),
});

// Models
const User = require("../models/User");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const ProcurementRequest = require("../models/ProcurementRequest");
const SupplyPool = require("../models/SupplyPool");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const ExternalOffer = require("../models/ExternalOffer");
const Allocation = require("../models/Allocation");
const PurchaseCommitment = require("../models/PurchaseCommitment");
const PaymentTransaction = require("../models/PaymentTransaction");

const MONGODB_URI = process.env.MONGODB_URI;

// ============================================================
// PUT YOUR WORKING SUPABASE IMAGE URL HERE
// Same image is intentionally reused for the demo.
// ============================================================

const DEMO_IMAGE_URL =
    "https://your-supabase-project.supabase.co/storage/v1/object/public/produce-images/demo-produce.jpg";

const IMAGE_URLS = [DEMO_IMAGE_URL];

// ============================================================
// HELPERS
// ============================================================

function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

function hoursFromNow(hours) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function getOrCreateDemoUser({
    phone,
    name,
    role,
    location,
}) {
    let user = await User.findOne({ phone });

    if (!user) {
        user = await User.create({
            name,
            phone,

            // Known-good bcrypt hash from your existing demo/auth data.
            passwordHash:
                "$2b$12$p7XWlA/k6lmZSEX8vstyeuOMslwpEruJci8l4EDyryjlamzSCnXna",

            role,
            verificationStatus: "verified",
            location,
            isActive: true,
        });
    } else {
        user.name = name;
        user.role = role;
        user.verificationStatus = "verified";
        user.location = location;
        user.isActive = true;

        await user.save();
    }

    return user;
}

// ============================================================
// MAIN SEED
// ============================================================

async function seedDemo() {
    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI is missing from your environment variables."
        );
    }

    await mongoose.connect(MONGODB_URI);

    // Remove old unique auction index from previous schema version
    try {
        await PurchaseCommitment.collection.dropIndex("auction_1");
        console.log("Old purchase commitment index removed.");
    } catch (error) {
        if (error.codeName !== "IndexNotFound") {
            throw error;
        }
    }

    console.log("========================================");
    console.log(" MongoDB connected");
    console.log(" Starting e-Arthiya demo seed...");
    console.log("========================================");

    // ==========================================================
    // 1. DEMO USERS
    //
    // These are the accounts you can use in the video.
    // ==========================================================

    const swae = await getOrCreateDemoUser({
        phone: "7065511631",
        name: "Swae",
        role: "farmer",
        location: {
            state: "Uttar Pradesh",
            district: "Ghaziabad",
            village: "Demo Village",
        },
    });

    const gyanesh = await getOrCreateDemoUser({
        phone: "7065511632",
        name: "Gyanesh",
        role: "buyer",
        location: {
            state: "Delhi",
            district: "New Delhi",
            village: "Buyer Market",
        },
    });

    const mahesh = await getOrCreateDemoUser({
        phone: "7065511633",
        name: "Mahesh Traders",
        role: "arthiya",
        location: {
            state: "Uttar Pradesh",
            district: "Ghaziabad",
            village: "Mandi Road",
        },
    });

    const rupa = await getOrCreateDemoUser({
        phone: "7065511634",
        name: "Rupa FPO",
        role: "fpo",
        location: {
            state: "Uttar Pradesh",
            district: "Ghaziabad",
            village: "Kisan Nagar",
        },
    });

    const farmerB = await getOrCreateDemoUser({
        phone: "7065511635",
        name: "Amit Farmer",
        role: "farmer",
        location: {
            state: "Uttar Pradesh",
            district: "Ghaziabad",
            village: "Kisan Nagar",
        },
    });

    const farmerC = await getOrCreateDemoUser({
        phone: "7065511636",
        name: "Sunita Farmer",
        role: "farmer",
        location: {
            state: "Uttar Pradesh",
            district: "Ghaziabad",
            village: "Kisan Nagar",
        },
    });

    // ==========================================================
    // 2. CLEAN OLD DEMO DATA
    //
    // Only records connected to the 70655 demo users are removed.
    // Your other test/real records remain untouched.
    // ==========================================================

    const demoUserIds = [
        swae._id,
        gyanesh._id,
        mahesh._id,
        rupa._id,
        farmerB._id,
        farmerC._id,
    ];

    const oldLots = await ProduceLot.find({
        farmer: { $in: demoUserIds },
    }).select("_id");

    const oldIntents = await SupplyIntent.find({
        farmer: { $in: demoUserIds },
    }).select("_id");

    const oldRequests = await ProcurementRequest.find({
        buyer: { $in: demoUserIds },
    }).select("_id");

    const oldAuctions = await Auction.find({
        lot: {
            $in: oldLots.map((x) => x._id),
        },
    }).select("_id");

    const oldBids = await Bid.find({
        auction: {
            $in: oldAuctions.map((x) => x._id),
        },
    }).select("_id");

    const oldOffers = await ExternalOffer.find({
        auction: {
            $in: oldAuctions.map((x) => x._id),
        },
    }).select("_id");

    const oldPools = await SupplyPool.find({
        $or: [
            {
                aggregator: {
                    $in: demoUserIds,
                },
            },
            {
                procurementRequests: {
                    $in: oldRequests.map((x) => x._id),
                },
            },
            {
                "contributors.farmer": {
                    $in: demoUserIds,
                },
            },
        ],
    }).select("_id");

    const oldCommitments =
        await PurchaseCommitment.find({
            $or: [
                {
                    buyer: {
                        $in: demoUserIds,
                    },
                },
                {
                    lot: {
                        $in: oldLots.map((x) => x._id),
                    },
                },
                {
                    supplyIntent: {
                        $in: oldIntents.map((x) => x._id),
                    },
                },
                {
                    supplyPool: {
                        $in: oldPools.map((x) => x._id),
                    },
                },
                {
                    procurementRequest: {
                        $in: oldRequests.map((x) => x._id),
                    },
                },
                {
                    auction: {
                        $in: oldAuctions.map((x) => x._id),
                    },
                },
            ],
        }).select("_id");

    await PaymentTransaction.deleteMany({
        commitment: {
            $in: oldCommitments.map((x) => x._id),
        },
    });

    await Allocation.deleteMany({
        $or: [
            {
                procurementRequest: {
                    $in: oldRequests.map((x) => x._id),
                },
            },
            {
                farmer: {
                    $in: demoUserIds,
                },
            },
        ],
    });

    await PurchaseCommitment.deleteMany({
        _id: {
            $in: oldCommitments.map((x) => x._id),
        },
    });

    await ExternalOffer.deleteMany({
        _id: {
            $in: oldOffers.map((x) => x._id),
        },
    });

    await Bid.deleteMany({
        _id: {
            $in: oldBids.map((x) => x._id),
        },
    });

    await Auction.deleteMany({
        _id: {
            $in: oldAuctions.map((x) => x._id),
        },
    });

    await SupplyPool.deleteMany({
        _id: {
            $in: oldPools.map((x) => x._id),
        },
    });

    await ProcurementRequest.deleteMany({
        _id: {
            $in: oldRequests.map((x) => x._id),
        },
    });

    await SupplyIntent.deleteMany({
        _id: {
            $in: oldIntents.map((x) => x._id),
        },
    });

    await ProduceLot.deleteMany({
        _id: {
            $in: oldLots.map((x) => x._id),
        },
    });

    console.log("Old demo records cleared.");

    // ==========================================================
    // 3. PRODUCE LOTS
    //
    // ONLY FOUR CROPS:
    //
    // Tomato
    // Potato
    // Onion
    // Wheat
    //
    // HERO FLOW:
    //
    // 6q Tomato
    // + 7q Tomato
    // + 7q Tomato
    // = 20q Tomato
    // ==========================================================

    const tomatoA = await ProduceLot.create({
        farmer: swae._id,

        crop: "Tomato",
        variety: "Hybrid Tomato",

        quantity: 6,
        unit: "quintal",

        expectedPrice: 2200,

        harvestDate: daysFromNow(-2),

        qualityGrade: "A",

        location: swae.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "fpo",
        aggregator: rupa._id,

        availableFrom: daysFromNow(-1),

        status: "available",
    });

    const tomatoB = await ProduceLot.create({
        farmer: farmerB._id,

        crop: "Tomato",
        variety: "Hybrid Tomato",

        quantity: 7,
        unit: "quintal",

        expectedPrice: 2150,

        harvestDate: daysFromNow(-2),

        qualityGrade: "A",

        location: farmerB.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "fpo",
        aggregator: rupa._id,

        availableFrom: daysFromNow(-1),

        status: "available",
    });

    const tomatoC = await ProduceLot.create({
        farmer: farmerC._id,

        crop: "Tomato",
        variety: "Hybrid Tomato",

        quantity: 7,
        unit: "quintal",

        expectedPrice: 2180,

        harvestDate: daysFromNow(-1),

        qualityGrade: "A",

        location: farmerC.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "fpo",
        aggregator: rupa._id,

        availableFrom: daysFromNow(-1),

        status: "available",
    });

    // ==========================================================
    // POTATO
    // Auction example
    // ==========================================================

    const potatoLot = await ProduceLot.create({
        farmer: swae._id,

        crop: "Potato",
        variety: "Kufri Jyoti",

        quantity: 12,
        unit: "quintal",

        expectedPrice: 1900,

        harvestDate: daysFromNow(-4),

        qualityGrade: "A",

        location: swae.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "arthiya",
        aggregator: mahesh._id,

        availableFrom: daysFromNow(-2),

        status: "in_auction",
    });

    const potatoLot2 = await ProduceLot.create({
        farmer: farmerB._id,

        crop: "Potato",
        variety: "Kufri Jyoti",

        quantity: 8,
        unit: "quintal",

        expectedPrice: 1850,

        harvestDate: daysFromNow(-3),

        qualityGrade: "A",

        location: farmerB.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "direct",
        aggregator: null,

        availableFrom: daysFromNow(-1),

        status: "available",
    });

    // ==========================================================
    // ONION
    // ==========================================================

    const onionLot = await ProduceLot.create({
        farmer: farmerC._id,

        crop: "Onion",
        variety: "Red Onion",

        quantity: 15,
        unit: "quintal",

        expectedPrice: 2500,

        harvestDate: daysFromNow(-5),

        qualityGrade: "A",

        location: farmerC.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "direct",
        aggregator: null,

        availableFrom: daysFromNow(-2),

        status: "available",
    });

    // ==========================================================
    // WHEAT
    // ==========================================================

    const wheatLot = await ProduceLot.create({
        farmer: farmerB._id,

        crop: "Wheat",
        variety: "HD 2967",

        quantity: 20,
        unit: "quintal",

        expectedPrice: 2450,

        harvestDate: daysFromNow(-7),

        qualityGrade: "A",

        location: farmerB.location,

        images: IMAGE_URLS,

        supplyType: "spot",

        aggregatorType: "arthiya",
        aggregator: mahesh._id,

        availableFrom: daysFromNow(-3),

        status: "available",
    });

    console.log("Produce lots created.");

    // ==========================================================
    // 4. FUTURE SUPPLY INTENTS
    // ==========================================================

    const tomatoFuture =
        await SupplyIntent.create({
            farmer: farmerC._id,

            crop: "Tomato",
            variety: "Hybrid Tomato",

            expectedQuantity: 18,
            unit: "quintal",

            expectedHarvestDate: daysFromNow(14),

            supplyType: "preorder",

            qualityExpectation:
                "Grade A, sorted and crate packed",

            location: farmerC.location,

            aggregatorType: "fpo",
            aggregator: rupa._id,

            status: "available",
        });

    const onionFuture =
        await SupplyIntent.create({
            farmer: swae._id,

            crop: "Onion",
            variety: "Red Onion",

            expectedQuantity: 25,
            unit: "quintal",

            expectedHarvestDate: daysFromNow(21),

            supplyType: "preorder",

            qualityExpectation:
                "Grade A, dry and sorted",

            location: swae.location,

            aggregatorType: "arthiya",
            aggregator: mahesh._id,

            status: "available",
        });

    const wheatFuture =
        await SupplyIntent.create({
            farmer: farmerB._id,

            crop: "Wheat",
            variety: "HD 2967",

            expectedQuantity: 30,
            unit: "quintal",

            expectedHarvestDate: daysFromNow(18),

            supplyType: "preorder",

            qualityExpectation:
                "Clean grain, Grade A",

            location: farmerB.location,

            aggregatorType: "direct",
            aggregator: null,

            status: "available",
        });

    console.log("Future supply intents created.");

    // ==========================================================
    // 5. BUYER DEMAND
    // ==========================================================

    // HERO REQUIREMENT
    // 20 quintal Tomato
    // ==========================================================

    const tomatoDemand =
        await ProcurementRequest.create({
            buyer: gyanesh._id,

            crop: "Tomato",
            variety: "Hybrid Tomato",

            quantity: 20,
            unit: "quintal",

            requiredBy: daysFromNow(5),

            availabilityFrom: daysFromNow(0),

            qualityRequirement:
                "Grade A, sorted, fresh, minimal damage",

            location: {
                state: "Delhi",
                district: "New Delhi",
                village: "Azadpur Market",
            },

            demandType: "spot",

            status: "partially_fulfilled",
        });

    // ==========================================================
    // POTATO DEMAND
    // ==========================================================

    const potatoDemand =
        await ProcurementRequest.create({
            buyer: gyanesh._id,

            crop: "Potato",
            variety: "Kufri Jyoti",

            quantity: 12,
            unit: "quintal",

            requiredBy: daysFromNow(4),

            availabilityFrom: daysFromNow(0),

            qualityRequirement:
                "Grade A, sorted",

            location: {
                state: "Delhi",
                district: "New Delhi",
                village: "Azadpur Market",
            },

            demandType: "spot",

            status: "open",
        });

    // ==========================================================
    // ONION FORWARD DEMAND
    // ==========================================================

    const onionDemand =
        await ProcurementRequest.create({
            buyer: gyanesh._id,

            crop: "Onion",
            variety: "Red Onion",

            quantity: 25,
            unit: "quintal",

            requiredBy: daysFromNow(20),

            availabilityFrom: daysFromNow(12),

            qualityRequirement:
                "Dry, sorted, Grade A",

            location: {
                state: "Delhi",
                district: "New Delhi",
                village: "Azadpur Market",
            },

            demandType: "forward",

            status: "open",
        });

    // ==========================================================
    // WHEAT FORWARD DEMAND
    // ==========================================================

    const wheatDemand =
        await ProcurementRequest.create({
            buyer: gyanesh._id,

            crop: "Wheat",
            variety: "HD 2967",

            quantity: 30,
            unit: "quintal",

            requiredBy: daysFromNow(17),

            availabilityFrom: daysFromNow(14),

            qualityRequirement:
                "Clean grain, Grade A",

            location: {
                state: "Delhi",
                district: "New Delhi",
                village: "Azadpur Market",
            },

            demandType: "forward",

            status: "open",
        });

    console.log("Buyer demands created.");

    // ==========================================================
    // 6. FPO SUPPLY POOL
    //
    // 6 + 7 + 7 = 20
    // ==========================================================

    const tomatoPool =
        await SupplyPool.create({
            crop: "Tomato",

            variety: "Hybrid Tomato",

            totalQuantity: 20,

            unit: "quintal",

            contributors: [
                {
                    farmer: swae._id,

                    sourceType: "lot",

                    sourceId: tomatoA._id,

                    quantity: 6,
                },

                {
                    farmer: farmerB._id,

                    sourceType: "lot",

                    sourceId: tomatoB._id,

                    quantity: 7,
                },

                {
                    farmer: farmerC._id,

                    sourceType: "lot",

                    sourceId: tomatoC._id,

                    quantity: 7,
                },
            ],

            aggregatorType: "fpo",

            aggregator: rupa._id,

            procurementRequests: [
                tomatoDemand._id,
            ],

            availabilityFrom: daysFromNow(0),

            availabilityUntil: daysFromNow(6),

            status: "ready",
        });

    // ==========================================================
    // FUTURE TOMATO POOL
    // ==========================================================

    const futureTomatoPool =
        await SupplyPool.create({
            crop: "Tomato",

            variety: "Hybrid Tomato",

            totalQuantity: 18,

            unit: "quintal",

            contributors: [
                {
                    farmer: farmerC._id,

                    sourceType: "supply_intent",

                    sourceId: tomatoFuture._id,

                    quantity: 18,
                },
            ],

            aggregatorType: "fpo",

            aggregator: rupa._id,

            procurementRequests: [],

            availabilityFrom: daysFromNow(14),

            availabilityUntil: daysFromNow(18),

            status: "forming",
        });

    console.log("Supply pools created.");

    // ==========================================================
    // 7. ALLOCATION
    //
    // 6q + 7q + 7q = 20q
    // ==========================================================

    await Allocation.create([
        {
            procurementRequest:
                tomatoDemand._id,

            farmer: swae._id,

            sourceType: "lot",

            sourceId: tomatoA._id,

            allocatedQuantity: 6,

            unit: "quintal",

            status: "committed",

            allocatedAt: new Date(),
        },

        {
            procurementRequest:
                tomatoDemand._id,

            farmer: farmerB._id,

            sourceType: "lot",

            sourceId: tomatoB._id,

            allocatedQuantity: 7,

            unit: "quintal",

            status: "reserved",

            allocatedAt: new Date(),
        },

        {
            procurementRequest:
                tomatoDemand._id,

            farmer: farmerC._id,

            sourceType: "lot",

            sourceId: tomatoC._id,

            allocatedQuantity: 7,

            unit: "quintal",

            status: "reserved",

            allocatedAt: new Date(),
        },
    ]);

    console.log("Allocations created.");

    // ==========================================================
    // 8. POTATO AUCTION
    // ==========================================================

    const potatoAuction =
        await Auction.create({
            lot: potatoLot._id,

            startTime: hoursFromNow(-3),

            endTime: hoursFromNow(21),

            startingPrice: 1900,

            currentHighestBid: 2250,

            status: "open",
        });

    const bid1 =
        await Bid.create({
            auction: potatoAuction._id,

            buyer: gyanesh._id,

            amount: 2150,

            status: "active",
        });

    const bid2 =
        await Bid.create({
            auction: potatoAuction._id,

            buyer: gyanesh._id,

            amount: 2250,

            status: "winning",
        });

    const externalOffer =
        await ExternalOffer.create({
            auction: potatoAuction._id,

            offeredAmount: 2350,

            buyerName:
                "Azadpur Fresh Traders",

            buyerPhone:
                "9810012345",

            submittedByFarmer:
                swae._id,

            evidence: [
                "WhatsApp quote verified by farmer",
            ],

            status: "selected",
        });

    potatoAuction.highestBid = bid2._id;
    potatoAuction.currentHighestBid = 2250;

    potatoAuction.selectedExternalOffer = externalOffer._id;
    potatoAuction.status = "closed_external_offer";
    potatoAuction.closedAt = new Date();

    await potatoAuction.save();

    console.log("Auction + bids + external offer created.");

    // ==========================================================
    // 9. PURCHASE COMMITMENTS
    // ==========================================================

    // ==========================================================
    // TOMATO HERO COMMITMENT
    // ==========================================================

    const tomatoCommitment =
        await PurchaseCommitment.create({
            auction: null,

            lot: null,

            supplyIntent: null,

            supplyPool:
                tomatoPool._id,

            procurementRequest:
                tomatoDemand._id,

            source:
                "direct_commitment",

            buyer:
                gyanesh._id,

            agreedPrice:
                2400,

            quantity:
                20,

            unit:
                "quintal",

            depositPercentage:
                50,

            depositAmount:
                24000,

            commitmentWindowEndsAt:
                daysFromNow(2),

            status:
                "pending_deposit",

            reroutingStatus:
                "not_required",

            settlement: {
                cropValue: 48000,

                farmerAmount: 48000,

                serviceFee: 0,

                facilitatorCommission: 0,

                platformFee: 0,

                depositApplied: 0,

                settledAt: null,
            },
        });

    // ==========================================================
    // EXTERNAL OFFER COMMITMENT
    // ==========================================================

    const potatoCommitment =
        await PurchaseCommitment.create({
            auction:
                potatoAuction._id,

            lot:
                potatoLot._id,

            procurementRequest: null,

            source:
                "external_offer",

            buyer: null,

            externalBuyerName:
                "Azadpur Fresh Traders",

            externalBuyerPhone:
                "9810012345",

            agreedPrice:
                2350,

            quantity:
                12,

            unit:
                "quintal",

            depositPercentage:
                50,

            depositAmount:
                14100,

            commitmentWindowEndsAt:
                daysFromNow(1),

            status:
                "created",

            reroutingStatus:
                "not_required",

            settlement: {
                cropValue: 28200,

                farmerAmount: 28200,

                serviceFee: 0,

                facilitatorCommission: 0,

                platformFee: 0,

                depositApplied: 0,

                settledAt: null,
            },
        });

    // ==========================================================
    // ONION FORWARD COMMITMENT
    // ==========================================================

    const forwardCommitment =
        await PurchaseCommitment.create({
            supplyIntent:
                onionFuture._id,

            procurementRequest:
                onionDemand._id,

            source:
                "forward_commitment",

            buyer:
                gyanesh._id,

            agreedPrice:
                2700,

            quantity:
                25,

            unit:
                "quintal",

            depositPercentage:
                50,

            depositAmount:
                33750,

            commitmentWindowEndsAt:
                daysFromNow(3),

            status:
                "active",

            reroutingStatus:
                "not_required",

            settlement: {
                cropValue: 67500,

                farmerAmount: 67500,

                serviceFee: 0,

                facilitatorCommission: 0,

                platformFee: 0,

                depositApplied: 0,

                settledAt: null,
            },
        });

    console.log("Purchase commitments created.");

    // ==========================================================
    // 10. PAYMENTS
    // ==========================================================

    await PaymentTransaction.create([
        {
            commitment:
                tomatoCommitment._id,

            payer:
                gyanesh._id,

            receiver:
                rupa._id,

            type:
                "security_deposit",

            amount:
                24000,

            currency:
                "INR",

            status:
                "completed",

            paymentMethod:
                "demo",

            transactionReference:
                "DEMO-TOMATO-DEP-001",

            paidAt:
                new Date(),
        },

        {
            commitment:
                potatoCommitment._id,

            payer:
                gyanesh._id,

            receiver:
                swae._id,

            type:
                "security_deposit",

            amount:
                13500,

            currency:
                "INR",

            status:
                "completed",

            paymentMethod:
                "upi",

            transactionReference:
                "DEMO-POTATO-DEP-001",

            paidAt:
                new Date(),
        },

        {
            commitment:
                forwardCommitment._id,

            payer:
                gyanesh._id,

            receiver:
                swae._id,

            type:
                "security_deposit",

            amount:
                33750,

            currency:
                "INR",

            status:
                "pending",

            paymentMethod:
                "demo",

            transactionReference:
                "DEMO-ONION-DEP-001",

            paidAt:
                null,
        },

        {
            commitment:
                potatoCommitment._id,

            payer:
                gyanesh._id,

            receiver:
                swae._id,

            type:
                "balance_payment",

            amount:
                13500,

            currency:
                "INR",

            status:
                "pending",

            paymentMethod:
                "demo",

            transactionReference:
                "DEMO-POTATO-BAL-001",

            paidAt:
                null,
        },
    ]);

    console.log("Payment records created.");

    // ==========================================================
    // FINAL DEMO CHEAT SHEET
    // ==========================================================

    console.log("");
    console.log("========================================");
    console.log("       e-ARTHIYA DEMO READY");
    console.log("========================================");

    console.log("");
    console.log("DEMO LOGIN ACCOUNTS");
    console.log("----------------------------------------");
    console.log("Farmer  : 7065511631  Swae");
    console.log("Buyer   : 7065511632  Gyanesh");
    console.log("Arthiya : 7065511633  Mahesh Traders");
    console.log("FPO     : 7065511634  Rupa FPO");
    console.log("Farmer B: 7065511635  Amit Farmer");
    console.log("Farmer C: 7065511636  Sunita Farmer");

    console.log("");
    console.log("CROPS");
    console.log("----------------------------------------");
    console.log("Tomato | Potato | Onion | Wheat");

    console.log("");
    console.log("HERO FLOW");
    console.log("----------------------------------------");
    console.log("Swae      : 6q Tomato");
    console.log("Amit      : 7q Tomato");
    console.log("Sunita    : 7q Tomato");
    console.log("TOTAL     : 20q Tomato");
    console.log("FPO       : Rupa FPO");
    console.log("BUYER     : Gyanesh");
    console.log("POOL      : READY");
    console.log("COMMITMENT: PENDING DEPOSIT");
    console.log("PAYMENT   : SECURITY DEPOSIT COMPLETED");

    console.log("");
    console.log("AUCTION FLOW");
    console.log("----------------------------------------");
    console.log("Potato        : 12q");
    console.log("Starting      : Rs.1900/q");
    console.log("Platform bid  : Rs.2250/q");
    console.log("External offer: Rs.2350/q");

    console.log("");
    console.log("FORWARD FLOW");
    console.log("----------------------------------------");
    console.log("Onion         : 25q");
    console.log("Future supply : Swae");
    console.log("Future demand : Gyanesh");
    console.log("Commitment    : ACTIVE");
    console.log("Deposit       : PENDING");

    console.log("");
    console.log("========================================");
    console.log("       DEMO DATA SEEDED SUCCESSFULLY");
    console.log("========================================");
    console.log("");
}

// ============================================================
// RUN
// ============================================================

seedDemo()
    .then(async () => {
        await mongoose.disconnect();

        console.log("MongoDB disconnected.");
        process.exit(0);
    })
    .catch(async (error) => {
        console.error("");
        console.error("========================================");
        console.error("       DEMO SEED FAILED");
        console.error("========================================");
        console.error(error);

        await mongoose
            .disconnect()
            .catch(() => { });

        process.exit(1);
    });