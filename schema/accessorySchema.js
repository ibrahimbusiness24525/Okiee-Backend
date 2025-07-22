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

    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: false,
    },
}, { timestamps: true })

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
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: false,
    },
    profit: {
        type: Number,
        required: false,
        default: 0,
    },
    type: {
        type: String,
        enum: ["purchase", "sale"],
        required: true,
    }

}, {
    timestamps: true // ✅ This adds createdAt and updatedAt
})

module.exports = {
    Accessory: mongoose.model("Accessory", accessorySchema),
    AccessoryTransaction: mongoose.model("AccessoryTransaction", accessoryTransactionSchema)
};