const { default: mongoose } = require("mongoose");

const accessorySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    accessoryName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    perPiecePrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    profit: {
        type: Number,
        required: true,
        default: 0,
    },
    partyLedgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PartyLedger",
    },
    purchasePaymentStatus: {
        type: String,
        enum: ["paid", "pending"],
        default: "paid",
    },
    purchasePaymentType: {
        type: String,
        enum: ["full-payment", "credit"],
        required: true,
    },
    creditPaymentData: {
        payableAmountNow: { type: String, required: false },
        payableAmountLater: { type: String, required: false },
        totalPaidAmount: { type: Number, required: false },
        dateOfPayment: { type: Date, required: false },
    },
})

const accessoryTransactionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    accessoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Accessory",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    perPiecePrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    partyLedgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PartyLedger",
    },
    purchasePaymentStatus: {
        type: String,
        enum: ["paid", "pending"],
        default: "paid",
    },
    purchasePaymentType: {
        type: String,
        enum: ["full-payment", "credit"],
        required: true,
    },
    creditPaymentData: {
        payableAmountNow: { type: String, required: false },
        payableAmountLater: { type: String, required: false },
        totalPaidAmount: { type: Number, required: false },
        dateOfPayment: { type: Date, required: false },
    },

})

module.exports = {
    Accessory: mongoose.model("Accessory", accessorySchema),
    AccessoryTransaction: mongoose.model("AccessoryTransaction", accessoryTransactionSchema)
};