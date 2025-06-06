const { default: mongoose } = require("mongoose");
const PartyLedger = require("../schema/PartyLedgerSchema");
const { BulkPhonePurchase } = require("../schema/purchasePhoneSchema");

exports.createParty = async (req, res) => {
    const { partyName } = req.body;

    try {
        const existingParty = await PartyLedger.findOne({ partyName }).exec();
        if (existingParty) {
            return res.status(400).json({
                success: false,
                message: "Party name already exists. Please choose a different name.",
            });
        }

        const party = new PartyLedger({
            userId: req.user.id,
            partyName,
        });

        await party.save(); 

        res.status(201).json({
            success: true,
            message: "Record created successfully",
            data: party,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Party not created successfully",
        });
    }
};


exports.getAllPartyNames = async (req, res) => {
    try {
        // Ensure the user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID is required",
            });
        }

        // Fetch only party names for the logged-in user
        const parties = await PartyLedger.find({ userId: req.user.id })
            .select("partyName -_id")
            .exec();

        if (parties.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No parties found for this user",
            });
        }

        // Extract party names into an array
        const partyNames = parties.map(party => party.partyName);

        res.status(200).json({
            success: true,
            message: "Party names retrieved successfully",
            data: partyNames,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve party names",
        });
    }
};



exports.getAllPartiesRecords = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from request

        const partyLedger =  await PartyLedger.find({userId}).select("_id");

        if(!partyLedger){
            return res.status(400).json({
                success:false,
                message:"No parties found"
            })
        }

        const partyLedgerIds = partyLedger.map(party=> party._id)

        const bulkPurchases = await BulkPhonePurchase.find({ partyLedgerId: { $in: partyLedgerIds } })
        .populate("partyLedgerId", "partyName") // Get Party Name
        .populate("ramSimDetails"); // Get RAM/SIM details
        
        const formattedBulkPurchases = bulkPurchases.map((item)=>{
            return {
                buyingPrice: item.prices.buyingPrice,
                dealerPrice: item.prices.dealerPrice,
                _id:item._id,
                userId: item.userId,
                partyName:item.partyName,
                totalPurchasedMobiles: item.ramSimDetails.reduce((total, item) => total + item.imeiNumbers.length, 0),
                createdDate: item.createdAt,
                companyName: item.companyName,
                modelName: item.modelName,
                partyName: item.partyName,
                purchasePaymentStatus:item.purchasePaymentStatus,
                purchasePaymentType:item.purchasePaymentType,
                ...(item.purchasePaymentType === "credit" && {
                    payableAmountNow: item.creditPaymentData?.payableAmountNow || null,
                    payableAmountLater: item.creditPaymentData?.payableAmountLater || null,
                    dateOfPayment: item.creditPaymentData?.dateOfPayment || null,
                    totalPaidAmount: item.creditPaymentData?.totalPaidAmount || null,
                }),
            }
        })
        return res.status(200).json({
            success:true,
            message:"parties found successfully",
            data: formattedBulkPurchases
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve purchases",
        });
    }
};

exports.getBulkPurchasesByPartyId = async (req, res) => {
    try {
        const { id } = req.params; // ✅ Correctly extract ID

        const bulkPurchase = await BulkPhonePurchase.findById(id)
          .populate("partyLedgerId", "partyName") // ✅ Get party name
          .populate("ramSimDetails"); // ✅ Get RAM/SIM details
    
        if (!bulkPurchase) {
          return res.status(404).json({ success: false, message: "Bulk purchase not found" }); // ✅ Proper response
        }
    
        res.status(200).json({ success: true, data: bulkPurchase }); // ✅ Send response properly
    } catch (error) {
        console.error("Error fetching bulk purchase:", error);
        res.status(500).json({ success: false, message: "Failed to fetch bulk purchase details" }); // ✅ Handle error correctly
    }
};

