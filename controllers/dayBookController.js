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
      BulkPhonePurchase.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }).populate('ramSimDetails'),
      SingleSoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      SoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }).populate({
        path:"bulkPhonePurchaseId"
      }),
    ]);
  const [allSinglePhones, allBulkPhones] = await Promise.all([
  PurchasePhone.find({ userId }),
  BulkPhonePurchase.find({ userId })
    .populate({
      path: "ramSimDetails",
      populate: {
        path: "imeiNumbers"
      }
    }),
]);

// === SINGLE PHONES ===
const totalSinglePhones = allSinglePhones.length;

const totalSingleAmount = allSinglePhones.reduce((sum, phone) => {
  return sum + (phone.price?.purchasePrice || 0);
}, 0);

// === BULK PHONES ===
let totalBulkPhones = 0;
let totalBulkAmount = 0;

allBulkPhones.forEach((bulk) => {
  if (!bulk.ramSimDetails) return;

  bulk.ramSimDetails.forEach((ramSim) => {
    const imeiCount = ramSim.imeiNumbers?.length || 0;
    const priceOfOne = parseFloat(ramSim.priceOfOne) || 0;

    totalBulkPhones += imeiCount;
    totalBulkAmount += imeiCount * priceOfOne;
  });
});

// === TOTAL COMBINED STOCK ===
const totalStockCount = totalSinglePhones + totalBulkPhones;
const totalStockAmount = totalSingleAmount + totalBulkAmount;

  //   // Calculate total stock (ALL TIME)
  //   const totalSinglePhones = allSinglePhones.length;
  //   const totalBulkPhones = allBulkPhones.length;
  //   const totalStockCount = totalSinglePhones + totalBulkPhones;

  //   const totalSingleAmount = allSinglePhones.reduce((sum, phone) => {
  //     return sum + (phone.price?.purchasePrice || 0);
  //   }, 0);

  //   const totalBulkAmount = allBulkPhones.reduce((sum, bulk) => {
  //     return sum + (parseFloat(bulk.prices?.buyingPrice) || 0);
  //   }, 0);

  //   const totalStockAmount = totalSingleAmount + totalBulkAmount;



    res.status(200).json({
      message: `Records fetched for ${dateParam || 'today'}`,
      data: {
        ledger,
        purchasedSinglePhone,
        purchaseBulkPhone,
        soldSinglePhone,
        soldBulkPhone,
        totalStockCount,
        totalStockAmount,
      },
    });

  } catch (err) {
    console.log("Error in getToDayBook:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
