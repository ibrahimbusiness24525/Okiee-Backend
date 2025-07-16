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
   


})

module.exports = {
    Accessory: mongoose.model("Accessory", accessorySchema),
    AccessoryTransaction: mongoose.model("AccessoryTransaction", accessoryTransactionSchema)
};