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

        // Aggregate purchases grouped by partyName for a specific user
        const bulkPurchases = await BulkPhonePurchase.aggregate([
            {
                $lookup: {
                    from: "partyledgers", // Make sure this matches your MongoDB collection name
                    localField: "partyName",
                    foreignField: "partyName",
                    as: "partyDetails"
                }
            },
            {
                $unwind: "$partyDetails" // Flatten the array returned by $lookup
            },
            {
                $match: { "partyDetails.userId": new mongoose.Types.ObjectId(userId) } // Filter by userId
            },
            {
                $group: {
                    _id: "$partyName",
                    purchases: { $push: "$$ROOT" } // Push all purchases into an array
                }
            },
            { $sort: { _id: 1 } } // Sort by partyName alphabetically
        ]);

        if (!bulkPurchases.length) {
            return res.status(404).json({
                success: false,
                message: "No purchases found for this user",
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: "Bulk purchases retrieved successfully",
            data: bulkPurchases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve purchases",
        });
    }
};

exports.getBulkPurchasesByPartyId = async (req, res) => {
    try {
        const { partyId } = req.params; 
        const userId = req.user.id; 

        const objectIdPartyId = new mongoose.Types.ObjectId(partyId);
        const purchases = await BulkPhonePurchase.find({
            partyLedgerId: objectIdPartyId,
            userId: userId,
        }).populate("partyLedgerId", "partyName"); 

        if (!purchases.length) {
            return res.status(404).json({
                success: false,
                message: "No purchases found for this party",
                data: [],
            });
        }

        res.status(200).json({
            success: true,
            message: "Bulk purchases retrieved successfully",
            data: purchases,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve purchases",
        });
    }
};
