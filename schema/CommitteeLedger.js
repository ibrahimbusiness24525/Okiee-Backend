const mongoose = require("mongoose");

// Committee Schema
const CommitteeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    committeeName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    numberOfMembers: {
        type: Number,
        required: true
    },
    headName: {
        type: String,
        required: true // Storing head by name
    }
});

// Member Schema
const MemberSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Committee",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    paymentHistory: [
        {
            month: String, // Example: "February 2025"
            status: { type: Boolean, default: false } // Paid or Unpaid
        }
    ]
});

// Export models
const Committee = mongoose.model("Committee", CommitteeSchema);
const Member = mongoose.model("Member", MemberSchema);

module.exports = { Committee, Member };
