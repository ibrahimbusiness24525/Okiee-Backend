const Ledger = require('../schema/LedgerSchema');
const { PurchasePhone, SoldPhone, SingleSoldPhone, BulkPhonePurchase } = require('../schema/purchasePhoneSchema');
const { getTodaysLedger } = require('./ledgerController');
exports.getToDayBook = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [ledger,purchasedSinglePhone,purchaseBulkPhone,soldSinglePhone, soldBulkPhone] = await Promise.all([
            Ledger.find({createdAt: { $gte: today, $lt: tomorrow }}),
            PurchasePhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
            BulkPhonePurchase.find({createdAt: { $gte: today, $lt: tomorrow }}),
            SingleSoldPhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
            SoldPhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
        ]);

        res.status(200).json({
            message: "Today's records fetched successfully",
            data: {
                ledger,
                purchasedSinglePhone,
                purchaseBulkPhone,
                soldSinglePhone,
                soldBulkPhone
            },
          });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}