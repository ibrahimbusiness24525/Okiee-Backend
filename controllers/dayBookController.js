const Ledger = require('../schema/LedgerSchema');
const { PurchasePhone, SoldPhone, SingleSoldPhone, BulkPhonePurchase } = require('../schema/purchasePhoneSchema');
const { getTodaysLedger } = require('./ledgerController');
// exports.getToDayBook = async (req, res) => {
//     try {
//       const today = new Date();
//       today.setHours(0,0,0,0);
//       const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const [ledger,purchasedSinglePhone,purchaseBulkPhone,soldSinglePhone, soldBulkPhone] = await Promise.all([
//             Ledger.find({createdAt: { $gte: today, $lt: tomorrow }}),
//             PurchasePhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
//             BulkPhonePurchase.find({createdAt: { $gte: today, $lt: tomorrow }}),
//             SingleSoldPhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
//             SoldPhone.find({createdAt: { $gte: today, $lt: tomorrow }}),
//         ]);

//         res.status(200).json({
//             message: "Today's records fetched successfully",
//             data: {
//                 ledger,
//                 purchasedSinglePhone,
//                 purchaseBulkPhone,
//                 soldSinglePhone,
//                 soldBulkPhone
//             },
//           });
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }
// exports.getToDayBook = async (req, res) => {
//     try {
//       const userId = req.user.id; 
      
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);
  
//       const [ledger, purchasedSinglePhone, purchaseBulkPhone, soldSinglePhone, soldBulkPhone] = await Promise.all([
//         Ledger.find({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
//         PurchasePhone.find({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
//         BulkPhonePurchase.find({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
//         SingleSoldPhone.find({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
//         SoldPhone.find({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
//       ]);
  
//       res.status(200).json({
//         message: "Today's records fetched successfully",
//         data: {
//           ledger,
//           purchasedSinglePhone,
//           purchaseBulkPhone,
//           soldSinglePhone,
//           soldBulkPhone,
//         },
//       });
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   };
exports.getToDayBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateParam = req.query.date;


    let selectedDate = new Date();
    if (dateParam) {
      selectedDate = new Date(dateParam);
      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
    }

    // Set start and end of the day
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const [ledger, purchasedSinglePhone, purchaseBulkPhone, soldSinglePhone, soldBulkPhone] = await Promise.all([
      Ledger.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      PurchasePhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      BulkPhonePurchase.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      SingleSoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      SoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
    ]);

    res.status(200).json({
      message: `Records fetched for ${dateParam || 'today'}`,
      data: {
        ledger,
        purchasedSinglePhone,
        purchaseBulkPhone,
        soldSinglePhone,
        soldBulkPhone,
      },
    });

  } catch (err) {
    console.log("Error in getToDayBook:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
