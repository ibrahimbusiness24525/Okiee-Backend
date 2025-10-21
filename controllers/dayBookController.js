const { Accessory, AccessoryTransaction } = require("../schema/accessorySchema");
const Ledger = require("../schema/LedgerSchema");
const {
  Person,
  CreditTransaction,
} = require("../schema/PayablesAndReceiveablesSchema");
const {
  PurchasePhone,
  SoldPhone,
  SingleSoldPhone,
  BulkPhonePurchase,
} = require("../schema/purchasePhoneSchema");
const { getTodaysLedger } = require("./ledgerController");
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
// //   };
// exports.getToDayBook = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const dateParam = req.query.date;

//     let selectedDate = new Date();
//     if (dateParam) {
//       selectedDate = new Date(dateParam);
//       if (isNaN(selectedDate.getTime())) {
//         return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
//       }
//     }

//     // Set start and end of the day
//     selectedDate.setHours(0, 0, 0, 0);
//     const nextDate = new Date(selectedDate);
//     nextDate.setDate(nextDate.getDate() + 1);

//     const [ledger, purchasedSinglePhone, purchaseBulkPhone, soldSinglePhone, soldBulkPhone] = await Promise.all([
//       Ledger.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
//       PurchasePhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
//       BulkPhonePurchase.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }).populate('ramSimDetails'),
//       SingleSoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
//       SoldPhone.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }).populate({
//         path: "bulkPhonePurchaseId",
//         select: "prices.buyingPrice"
//       }),
//     ]);
//     const [allSinglePhones, allBulkPhones] = await Promise.all([
//       PurchasePhone.find({ userId }),
//       BulkPhonePurchase.find({ userId })
//         .populate({
//           path: "ramSimDetails",
//           populate: {
//             path: "imeiNumbers"
//           }
//         }),
//     ]);

//     // === SINGLE PHONES ===
//     const totalSinglePhones = allSinglePhones.length;

//     const totalSingleAmount = allSinglePhones.reduce((sum, phone) => {
//       return sum + (phone.price?.purchasePrice || 0);
//     }, 0);

//     // === BULK PHONES ===
//     let totalBulkPhones = 0;
//     let totalBulkAmount = 0;

//     allBulkPhones.forEach((bulk) => {
//       if (!bulk.ramSimDetails) return;

//       bulk.ramSimDetails.forEach((ramSim) => {
//         const imeiCount = ramSim.imeiNumbers?.length || 0;
//         const priceOfOne = parseFloat(ramSim.priceOfOne) || 0;

//         totalBulkPhones += imeiCount;
//         totalBulkAmount += imeiCount * priceOfOne;
//       });
//     });

//     const totalStockCount = totalSinglePhones + totalBulkPhones;
//     const totalStockAmount = totalSingleAmount + totalBulkAmount;

//     res.status(200).json({
//       message: `Records fetched for ${dateParam || 'today'}`,
//       data: {
//         ledger,
//         purchasedSinglePhone,
//         purchaseBulkPhone,
//         soldSinglePhone,
//         soldBulkPhone,
//         totalStockCount,
//         totalStockAmount,
//       },
//     });

//   } catch (err) {
//     console.log("Error in getToDayBook:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.getToDayBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateParam = req.query.date;
    const startParam = req.query.startDate;
    const endParam = req.query.endDate;

    let selectedDate = new Date();
    let nextDate;

    // If both startDate and endDate are provided, use range mode
    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid date range. Use YYYY-MM-DD for startDate and endDate." });
      }
      // Normalize to [start@00:00:00.000, end+1day@00:00:00.000) to keep $lt semantics
      selectedDate = new Date(start);
      selectedDate.setHours(0, 0, 0, 0);
      nextDate = new Date(end);
      nextDate.setHours(0, 0, 0, 0);
      nextDate.setDate(nextDate.getDate() + 1);
    } else {
      // Fallback to single day mode (existing behavior)
      if (dateParam) {
        selectedDate = new Date(dateParam);
        if (isNaN(selectedDate.getTime())) {
          return res
            .status(400)
            .json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }
      }
      // Set start and end of the day
      selectedDate.setHours(0, 0, 0, 0);
      nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
    }

    const [
      ledger,
      purchasedSinglePhone,
      purchaseBulkPhone,
      soldSinglePhone,
      soldBulkPhone,
      allSinglePhones,
      allBulkPhones,
      persons,
      creditTransactions,
      accessories,
      accessoryTransactions,
    ] = await Promise.all([
      Ledger.find({ userId, createdAt: { $gte: selectedDate, $lt: nextDate } }),
      PurchasePhone.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      }),
      BulkPhonePurchase.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      }).populate("ramSimDetails"),
      SingleSoldPhone.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      }),
      SoldPhone.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      }).populate({
        path: "bulkPhonePurchaseId",
        select: "prices.buyingPrice salePrice",
      }),
      PurchasePhone.find({ userId }),
      BulkPhonePurchase.find({ userId }).populate({
        path: "ramSimDetails",
        populate: {
          path: "imeiNumbers",
        },
      }),
      Person.find({ userId }),
      CreditTransaction.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      }),
      Accessory.find({ userId,
        //  updatedAt: { $gte: selectedDate, $lt: nextDate } 
        }),
      AccessoryTransaction.find({
        userId,
        createdAt: { $gte: selectedDate, $lt: nextDate },
      })
    ]);
    console.log("accessories", accessories);
    // === PHONE STOCK CALCULATIONS ===
    const totalSinglePhones = allSinglePhones.length;
    const totalSingleAmount = allSinglePhones.reduce(
      (sum, phone) => sum + (phone.price?.purchasePrice || 0),
      0
    );
    const totalSingleNewAmount = allSinglePhones.reduce(
      (sum, phone) =>
        phone.phoneCondition === "New"
          ? sum + (phone.price?.purchasePrice || 0)
          : sum,
      0
    );
    const totalSingleUsedAmount = allSinglePhones.reduce(
      (sum, phone) =>
        phone.phoneCondition === "Used"
          ? sum + (phone.price?.purchasePrice || 0)
          : sum,
      0
    );

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
    const totalPayablePersons =
      persons.status === "Payable" ? persons.length : 0;
    const totalReceivablePersons =
      persons.status === "Receivable" ? persons.length : 0;
    // === CREDIT CALCULATIONS ===
    const totalPayable = persons.reduce(
      (sum, person) => sum + person.takingCredit,
      0
    );
    const totalReceivable = persons.reduce(
      (sum, person) => sum + person.givingCredit,
      0
    );

    // Daily credit transactions
    const dailyPayable = creditTransactions.reduce(
      (sum, txn) => sum + txn.takingCredit,
      0
    );
    const dailyReceivable = creditTransactions.reduce(
      (sum, txn) => sum + txn.givingCredit,
      0
    );
    const totalAccessoriesProfit = accessoryTransactions.reduce(
      (sum, transaction) => sum + (transaction.profit || 0),
      0
    );
    // const totalAccessoriesProfit = accessories.reduce(
    //   (sum, accessory) => sum + (accessory.profit || 0),
    //   0
    // );
    const totalAccesoriesTransactionLength = accessoryTransactions.length;
    // const totalAccessoryTransactionAmount = accessoryTransactions.reduce(
    //   (sum, transaction) => sum + (transaction.totalPrice || 0),
    //   0
    // );
    const totalAccessoryTransactionAmount = accessories.reduce(
      (sum, accessory) => sum + (accessory.totalPrice || 0),
      0
    );
    const todayPersonsOfAccessories = accessories.map(accessory => ({
      name: accessory?.personId?.name || "Unknown",
      phone: accessory?.personId?.number || "Unknown",
      totalPrice: accessory?.totalPrice || 0,
      profit: accessory?.profit || 0,
      accessoryName: accessory.accessoryName || "Unknown",
      quantity: accessory.quantity || 0,
    }));
    console.log("total single new stock amount:", totalSingleNewAmount);
    console.log("total single used stock amount:", totalSingleUsedAmount);
    console.log("total single used stock amount length:", allSinglePhones.filter(phone => phone.phoneCondition === "Used").length);
    console.log("total single new stock amount length:", allSinglePhones.filter(phone => phone.phoneCondition === "New").length);
    console.log("total bulk stock amount:", totalBulkAmount);
    console.log("total accessory stock amount:", totalAccessoryTransactionAmount);
    res.status(200).json({
      message: `Records fetched for ${dateParam || "today"}`,
      data: {
        ledger,
        purchasedSinglePhone,
        purchaseBulkPhone,
        soldSinglePhone,
        soldBulkPhone,
        totalStockCount: totalSinglePhones + totalBulkPhones,
        totalStockAmount: totalSingleAmount + totalBulkAmount + Number(totalAccessoryTransactionAmount),
        todayPersonsOfAccessories,
        totalAccessoriesProfit,
        totalAccesoriesTransactionLength,
        totalAccessoryTransactionAmount,
        // Echo back the effective date range used so the frontend can display it
        dateRange: {
          startDate: selectedDate,
          endDate: new Date(nextDate.getTime() - 1) // inclusive end (just before nextDate)
        },
        creditSummary: {
          totalPayable,
          totalReceivable,
          totalPayablePersons,
          totalReceivablePersons,
          dailyPayable,
          dailyReceivable,
          creditTransactions,
        },
      },
    });
  } catch (err) {
    console.log("Error in getToDayBook:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
