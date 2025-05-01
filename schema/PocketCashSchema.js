const mongoose = require('mongoose');

const PocketCashSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    accountCash: {
        type: Number,
        default:0,
        required: true
    },
    reasonOfAmountDeduction: {
        type: String,
        required: false
    },
    amountAdded:{
        type:Number,
        required:false,
    },
    amountDeducted:{
        type:Number,
        required:false,
    },
    remainigAmount:{
        type:Number,
        required:false,
    },
    sourceOfAmountAddition: {
        type: String,
        required: false
    },
},{timestamps: true})

const PocketCashTransaction = mongoose.model("PocketCashTransaction", PocketCashSchema);

module.exports = {PocketCashTransaction}