// models/PocketCashSchema.js
const mongoose = require('mongoose');

const PocketCash = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  accountCash: {
    type: Number,
    default: 0,
    required: true
  },
}, { timestamps: true });




const PocketCashTransaction = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountCash: {
    type: Number,
    required: true
  },
  pocketCashId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PocketCash',
    required: true,
  },
  personOfCashAddition: String,
  reasonOfAmountDeduction: String,
  amountAdded: Number,
  amountDeducted: Number,
  remainingAmount: Number,
  sourceOfAmountAddition: String,
}, { timestamps: true });

const PocketCashSchema = mongoose.model("PocketCash", PocketCash);
const PocketCashTransactionSchema = mongoose.model("PocketCashTransaction", PocketCashTransaction);

module.exports = { PocketCashSchema, PocketCashTransactionSchema };
