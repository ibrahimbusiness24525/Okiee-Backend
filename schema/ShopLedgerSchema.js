const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: { type: String, required: true },
  reference: { type: String, required: true }
}, { timestamps: true });

const shopLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  type: { type: String, enum: ['Expense', 'CashPaid', 'CashReceived'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },

}, { timestamps: true });

const Entity = mongoose.model('Entity', entitySchema);
const ShopLedger = mongoose.model('ShopLedger', shopLedgerSchema);

module.exports = { Entity, ShopLedger };
