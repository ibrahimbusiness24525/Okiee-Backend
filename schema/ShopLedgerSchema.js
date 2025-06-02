const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  reference: { type: String, required: true },
  expense: { type: Number, default: 0 },
  receiveCash: { type: Number, default: 0 },
  cashPaid: { type: Number, default: 0 },
  status: { type: String, enum: ["Payable", "Receivable", "Settled"], default: "Settled" },
}, { timestamps: true });

const shopLedgerTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  expense: { type: Number, default: 0 },
  receiveCash: { type: Number, default: 0 },
  cashPaid: { type: Number, default: 0 },
}, { timestamps: true });

const Entity = mongoose.model('Entity', entitySchema);
const ShopLedger = mongoose.model('ShopLedger', shopLedgerTransactionSchema);

module.exports = { Entity, ShopLedger };
