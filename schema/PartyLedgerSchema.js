const { default: mongoose } = require("mongoose");

const partyLedgerSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    // bulkPhonePurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "BulkPhonePurchase", required: true },
    partyName: {
        type: String,
        required: true
    },
},{timestamps: true})

const PartyLedger =  mongoose.model("PartyLedger", partyLedgerSchema);
module.exports = PartyLedger;   