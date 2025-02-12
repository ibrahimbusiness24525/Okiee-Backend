const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema(
  {
    openingCash: { type: Number, required: true, default: 0 },
    cashPaid: { type: Number, required: true, default: 0 },
    cashReceived: { type: Number, required: true, default: 0 },
    expense: { type: Number, required: true, default: 0 },
    closingCash: { type: Number, required: true, default: 0 },
    date: { type: String, required: true, unique: true }, 
    cashReceivedDetails: [
      { amount: { type: Number }, source: { type: String }, date: { type: Date } },
    ], 
    cashPaidDetails: [
      { amount: { type: Number }, recipient: { type: String }, date: { type: Date } },
    ], 
    expenseDetails: [
      { amount: { type: Number }, purpose: { type: String }, date: { type: Date } },
    ], 
  },
  { timestamps: true }
);

ledgerSchema.pre('save', function(next) {

  this.closingCash = this.openingCash + this.cashReceived - this.cashPaid - this.expense;
  next();
});


ledgerSchema.statics.archiveRecord = async function() {
  const todayRecord = await this.findOne({ date: new Date().toISOString().split('T')[0] });
  if (todayRecord) {
    const ArchivedLedger = mongoose.model('ArchivedLedger', ledgerSchema);
    await ArchivedLedger.create(todayRecord);
    await this.deleteOne({ date: new Date().toISOString().split('T')[0] }); // Remove the record for today
  }
};

const Ledger = mongoose.model('Ledger', ledgerSchema);
module.exports = Ledger;
