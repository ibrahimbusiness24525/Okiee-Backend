const mongoose = require('mongoose');

// const ledgerSchema = new mongoose.Schema({
//   openingCash: { type: Number, required: true, default: 0 },
//   cashPaid: { type: Number, required: true, default: 0 },
//   cashReceived: { type: Number, required: true, default: 0 },
//   expense: { type: Number, required: true, default: 0 },
//   closingCash: { type: Number, required: true, default: 0 },
//   date: { type: Date, required: true, unique: true }, // Store date for each day's entry
// }, { timestamps: true });

const ledgerSchema = new mongoose.Schema(
  {
    openingCash: { type: Number, required: true, default: 0 },
    cashPaid: { type: Number, required: true, default: 0 },
    cashReceived: { type: Number, required: true, default: 0 },
    expense: { type: Number, required: true, default: 0 },
    closingCash: { type: Number, required: true, default: 0 },
    date: { type: Date, required: true, unique: true }, // Store date for each day's entry
    // New fields for transaction details
    cashReceivedDetails: [
      { amount: { type: Number }, source: { type: String }, date: { type: Date } },
    ], // Details of received cash
    cashPaidDetails: [
      { amount: { type: Number }, recipient: { type: String }, date: { type: Date } },
    ], // Details of cash paid
    expenseDetails: [
      { amount: { type: Number }, purpose: { type: String }, date: { type: Date } },
    ], // Details of expenses
  },
  { timestamps: true }
);

ledgerSchema.pre('save', function(next) {
  // Calculate closing cash whenever any of the fields are modified
  this.closingCash = this.openingCash + this.cashReceived - this.cashPaid - this.expense;
  next();
});

// To store past records for history (you can opt for a different approach based on requirements)
ledgerSchema.statics.archiveRecord = async function() {
  const todayRecord = await this.findOne({ date: new Date().toISOString().split('T')[0] });
  if (todayRecord) {
    // Assuming you have a collection to store past records
    const ArchivedLedger = mongoose.model('ArchivedLedger', ledgerSchema);
    await ArchivedLedger.create(todayRecord);
    await this.deleteOne({ date: new Date().toISOString().split('T')[0] }); // Remove the record for today
  }
};

const Ledger = mongoose.model('Ledger', ledgerSchema);
module.exports = Ledger;
