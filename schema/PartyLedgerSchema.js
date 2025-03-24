const { default: mongoose } = require("mongoose");

const partyLedgerSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    partyName: {
        type: String,
        required: true
    },
},{timestamps: true})

const PartyLedger =  mongoose.model("PartyLedger", partyLedgerSchema);
module.exports = PartyLedger;   