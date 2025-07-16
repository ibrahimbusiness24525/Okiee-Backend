const {
  Accessory,
  AccessoryTransaction,
} = require("../schema/accessorySchema");
const {
  AddBankAccount,
  BankTransaction,
} = require("../schema/BankAccountSchema");
const { Person, CreditTransaction } = require("../schema/PayablesAndReceiveablesSchema");
const {
  PocketCashSchema,
  PocketCashTransactionSchema,
} = require("../schema/PocketCashSchema");

// CREATE a new accessory
const createAccessory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      accessoryName,
      quantity,
      perPiecePrice,
      givePayment,
      partyLedgerId,
      entityData,
      purchasePaymentType,
      creditPaymentData,
    } = req.body;

    if (!accessoryName || !quantity || !perPiecePrice || !purchasePaymentType) {
      return res.status(400).json({
        message: "Accessory name, quantity, price, and payment type are required",
      });
    }

    if (
      isNaN(quantity) ||
      isNaN(perPiecePrice) ||
      quantity <= 0 ||
      perPiecePrice <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Quantity and price must be positive numbers" });
    }

    const totalPrice = quantity * perPiecePrice;

    if (purchasePaymentType === "credit") {
    

      // Use Person and CreditTransaction for receivables

      // Find or create the person (customer) by name and number
      let person = await Person.findOne({
        _id: entityData._id,
        // name: personData,
        ...(entityData.number && { number: entityData.number }),
        userId: req.user.id,
      });

      if (!person) {
        person = await Person.create({
          userId: req.user.id,
          name: entityData.name,
          number: entityData.number,
          reference: "Accessory Purchase",
          takingCredit: Number(creditPaymentData.payableAmountLater),
          status: "Payable",
        });
      } else {
        person.takingCredit =
          Number(person.takingCredit || 0) + Number(creditPaymentData.payableAmountLater);
        person.status = "Payable";
        person.reference = "accessory Purchase";
        await person.save();
      }

      // Log the credit transaction
      await CreditTransaction.create({
        userId: req.user.id,
        personId: person._id,
        givingCredit: Number(creditPaymentData.payableAmountLater),
        description: `Credit purchase of accessory: ${accessoryName} by ${entityData.name}`,
      });
    }
    // Handle payment (only for full-payment or partial credit payment)
   
      // Bank payment
      if (givePayment?.bankAccountUsed) {
        const bank = await AddBankAccount.findById(givePayment.bankAccountUsed);
        if (!bank) return res.status(404).json({ message: "Bank not found" });

        const amountToDeduct =
          purchasePaymentType === "full-payment"
            ? totalPrice
            : Number(creditPaymentData.payableAmountNow);

        if (
          isNaN(amountToDeduct) ||
          amountToDeduct <= 0 ||
          amountToDeduct > bank.accountCash
        ) {
          return res.status(400).json({ message: "Invalid or insufficient bank amount" });
        }

        bank.accountCash -= amountToDeduct;
        await bank.save();

        await BankTransaction.create({
          bankId: bank._id,
          userId,
          reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,
          amount: amountToDeduct,
          accountCash: bank.accountCash,
          accountType: bank.accountType,

        });
  

      // Pocket payment
      if (givePayment?.amountFromPocket) {
        const pocketTransaction = await PocketCashSchema.findOne({ userId });
        if (!pocketTransaction) {
          return res.status(404).json({ message: "Pocket cash account not found." });
        }

        const amountToDeduct =
          purchasePaymentType === "full-payment"
            ? totalPrice
            : Number(creditPaymentData.payableAmountNow);

        if (
          isNaN(amountToDeduct) ||
          amountToDeduct <= 0 ||
          amountToDeduct > pocketTransaction.accountCash
        ) {
          return res.status(400).json({ message: "Invalid or insufficient pocket cash" });
        }

        pocketTransaction.accountCash -= amountToDeduct;
        await pocketTransaction.save();

        await PocketCashTransactionSchema.create({
          userId,
          pocketCashId: pocketTransaction._id,
          amountDeducted: amountToDeduct,
          accountCash: pocketTransaction.accountCash,
          remainingAmount: pocketTransaction.accountCash,
          reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,

        });
      }
    }

    // Create the new accessory
    const newAccessory = await Accessory.create({
      userId,
      accessoryName,
      quantity,
      perPiecePrice,
      totalPrice,
      stock: quantity,
      personId: entityData._id , // Use the person ID from the created or found person
   
    });

    // Log accessory transaction
    await AccessoryTransaction.create({
      userId,
      accessoryId: newAccessory._id,
      quantity,
      perPiecePrice,
      totalPrice,
      personId: entityData._id , // Use the person ID from the created or found person

 
    });

    res.status(201).json({
      message: "Accessory created successfully",
      accessory: newAccessory,
    });
  } catch (error) {
    console.error("Error creating accessory:", error);
    res.status(500).json({
      message: "Failed to create accessory",
      error: error.message,
    });
  }
};
// const createAccessory = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const {
//       accessoryName,
//       quantity,
//       perPiecePrice,
//       givePayment,
//       partyLedgerId,
//       purchasePaymentType,
//       creditPaymentData,
//     } = req.body;

//     if (!accessoryName || !quantity || !perPiecePrice || !purchasePaymentType) {
//       return res.status(400).json({
//         message: "Accessory name, quantity, price, and payment type are required",
//       });
//     }

//     if (
//       isNaN(quantity) ||
//       isNaN(perPiecePrice) ||
//       quantity <= 0 ||
//       perPiecePrice <= 0
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Quantity and price must be positive numbers" });
//     }

//     const totalPrice = quantity * perPiecePrice;

//     let purchasePaymentStatus = "paid";
//     let creditData = undefined;

//     if (purchasePaymentType === "credit") {
//       purchasePaymentStatus = "pending";
//       if (
//         !creditPaymentData ||
//         isNaN(creditPaymentData.payableAmountNow) ||
//         isNaN(creditPaymentData.payableAmountLater)
//       ) {
//         return res.status(400).json({
//           message: "Credit payment data is required for credit purchases",
//         });
//       }
//       creditData = {
//         payableAmountNow: creditPaymentData.payableAmountNow,
//         payableAmountLater: creditPaymentData.payableAmountLater,
//         totalPaidAmount: creditPaymentData.totalPaidAmount || 0,
//         dateOfPayment: creditPaymentData.dateOfPayment,
//       };
//     }

//     // Handle payment (only for full-payment or partial credit payment)
//     if (purchasePaymentType === "full-payment" || (purchasePaymentType === "credit" && Number(creditPaymentData.payableAmountNow) > 0)) {
//       // Bank payment
//       if (givePayment?.bankAccountUsed) {
//         const bank = await AddBankAccount.findById(givePayment.bankAccountUsed);
//         if (!bank) return res.status(404).json({ message: "Bank not found" });

//         const amountToDeduct =
//           purchasePaymentType === "full-payment"
//             ? totalPrice
//             : Number(creditPaymentData.payableAmountNow);

//         if (
//           isNaN(amountToDeduct) ||
//           amountToDeduct <= 0 ||
//           amountToDeduct > bank.accountCash
//         ) {
//           return res.status(400).json({ message: "Invalid or insufficient bank amount" });
//         }

//         bank.accountCash -= amountToDeduct;
//         await bank.save();

//         await BankTransaction.create({
//           bankId: bank._id,
//           userId,
//           reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,
//           amount: amountToDeduct,
//           accountCash: bank.accountCash,
//           accountType: bank.accountType,

//         });
//       }

//       // Pocket payment
//       if (givePayment?.amountFromPocket) {
//         const pocketTransaction = await PocketCashSchema.findOne({ userId });
//         if (!pocketTransaction) {
//           return res.status(404).json({ message: "Pocket cash account not found." });
//         }

//         const amountToDeduct =
//           purchasePaymentType === "full-payment"
//             ? totalPrice
//             : Number(creditPaymentData.payableAmountNow);

//         if (
//           isNaN(amountToDeduct) ||
//           amountToDeduct <= 0 ||
//           amountToDeduct > pocketTransaction.accountCash
//         ) {
//           return res.status(400).json({ message: "Invalid or insufficient pocket cash" });
//         }

//         pocketTransaction.accountCash -= amountToDeduct;
//         await pocketTransaction.save();

//         await PocketCashTransactionSchema.create({
//           userId,
//           pocketCashId: pocketTransaction._id,
//           amountDeducted: amountToDeduct,
//           accountCash: pocketTransaction.accountCash,
//           remainingAmount: pocketTransaction.accountCash,
//           reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,

//         });
//       }
//     }

//     // Create the new accessory
//     const newAccessory = await Accessory.create({
//       userId,
//       accessoryName,
//       quantity,
//       perPiecePrice,
//       totalPrice,
//       stock: quantity,
//       partyLedgerId: partyLedgerId || undefined,
//       purchasePaymentStatus,
//       purchasePaymentType,
//       creditPaymentData: creditData,
//     });

//     // Log accessory transaction
//     await AccessoryTransaction.create({
//       userId,
//       accessoryId: newAccessory._id,
//       quantity,
//       perPiecePrice,
//       totalPrice,
//       partyLedgerId: partyLedgerId || undefined,
//       purchasePaymentStatus,
//       purchasePaymentType,
//       creditPaymentData: creditData,
//     });

//     res.status(201).json({
//       message: "Accessory created successfully",
//       accessory: newAccessory,
//     });
//   } catch (error) {
//     console.error("Error creating accessory:", error);
//     res.status(500).json({
//       message: "Failed to create accessory",
//       error: error.message,
//     });
//   }
// };

// GET all accessories for the user
const getAllAccessories = async (req, res) => {
  try {
    const userId = req.user.id;
    const accessories = await Accessory.find({ userId });
    res.status(200).json(accessories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accessories", error });
  }
};

// SELL accessory (create transaction & update stock)
// const sellAccessory = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { accessoryId, quantity, perPiecePrice } = req.body;

//         const accessory = await Accessory.findOne({ _id: accessoryId, userId });
//         if (!accessory) return res.status(404).json({ message: "Accessory not found" });

//         if (accessory.stock < quantity) {
//             return res.status(400).json({ message: "Not enough stock available" });
//         }

//         const totalPrice = quantity * perPiecePrice;

//         // Create transaction
//         const transaction = await AccessoryTransaction.create({
//             userId,
//             accessoryId,
//             quantity,
//             perPiecePrice,
//             totalPrice,
//         });

//         // Update stock
//         accessory.stock -= quantity;
//         await accessory.save();

//         res.status(201).json({ message: "Accessory sold", transaction });
//     } catch (error) {
//         res.status(500).json({ message: "Failed to sell accessory", error });
//     }
// };
const sellMultipleAccessories = async (req, res) => {
  try {
    const userId = req.user.id;
    const sales = req.body.sales;

    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ message: "Sales array is required" });
    }

    const { getPayment } = req.body;
    const transactions = [];
    console.log("getPayment", getPayment);

    // Handle bank payment if provided
    if (getPayment?.bankAccountUsed) {
      const bank = await AddBankAccount.findById(getPayment.bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });
      console.log("amountFromBank", getPayment.amountFromBank);

      // Validate amount
      if (
        typeof Number(getPayment.amountFromBank) !== "number" ||
        Number(getPayment.amountFromBank) <= 0
      ) {
        return res.status(400).json({ message: "Invalid amount from bank" });
      }

      // Add to bank account (since we're receiving money from sale)
      bank.accountCash += Number(getPayment.amountFromBank);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: userId,
        reasonOfAmountDeduction: `selling accessories`,
        amount: getPayment.amountFromBank,
        accountCash: bank.accountCash,
        accountType: bank.accountType,
        transactionType: "credit",
      });
    }

    // Handle pocket cash if provided
    if (getPayment?.amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: userId,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (
        typeof Number(getPayment.amountFromPocket) !== "number" ||
        Number(getPayment.amountFromPocket) <= 0
      ) {
        return res.status(400).json({ message: "Invalid pocket cash amount" });
      }

      // Add to pocket cash (since we're receiving money from sale)
      pocketTransaction.accountCash += Number(getPayment.amountFromPocket);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: userId,
        pocketCashId: pocketTransaction._id,
        amountAdded: getPayment.amountFromPocket,
        accountCash: pocketTransaction.accountCash,
        remainingAmount: pocketTransaction.accountCash,
        sourceOfAmountAddition: `making sale of accessories`,
      });
    }

    // Process each sale
    for (const sale of sales) {
      const { accessoryId, quantity, perPiecePrice } = sale;

      // Validate sale data
      if (!accessoryId || !quantity || !perPiecePrice) {
        return res
          .status(400)
          .json({ message: "Missing required fields in sale item" });
      }

      if (quantity <= 0 || perPiecePrice <= 0) {
        return res
          .status(400)
          .json({ message: "Quantity and price must be positive numbers" });
      }

      const accessory = await Accessory.findOne({ _id: accessoryId, userId });
      if (!accessory) {
        return res
          .status(404)
          .json({ message: `Accessory not found: ${accessoryId}` });
      }

      if (accessory.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock for accessory: ${accessory.name}`,
        });
      }

      const totalPrice = quantity * perPiecePrice;

      const transaction = await AccessoryTransaction.create({
        userId,
        accessoryId,
        quantity,
        perPiecePrice,
        totalPrice,
        transactionType: "sale",
      });

      // Update stock
      accessory.stock -= quantity;
      accessory.totalPrice -=
        Number(accessory.perPiecePrice) * Number(quantity);
      accessory.profit +=
        (Number(perPiecePrice) - Number(accessory.perPiecePrice)) *
        Number(quantity); // Calculate profit
      await accessory.save();

      transactions.push(transaction);
    }

    res
      .status(201)
      .json({ message: "Accessories sold successfully", transactions });
  } catch (error) {
    console.error("Error selling accessories:", error);
    res
      .status(500)
      .json({ message: "Failed to sell accessories", error: error.message });
  }
};

// GET all transactions for the user
const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await AccessoryTransaction.find({ userId }).populate(
      "accessoryId",
      "accessoryName"
    );
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions", error });
  }
};

// DELETE accessory by ID (if owned by user)
const deleteAccessory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const accessory = await Accessory.findOneAndDelete({ _id: id, userId });
    if (!accessory)
      return res
        .status(404)
        .json({ message: "Accessory not found or unauthorized" });

    // Optionally, delete related transactions
    await AccessoryTransaction.deleteMany({ accessoryId: id, userId });

    res
      .status(200)
      .json({ message: "Accessory and related transactions deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete accessory", error });
  }
};

const getAccessoriesData = async (req, res) => {
  try {
    const userId = req.user.id;
    const accessories = await Accessory.find({ userId });
    const totalProfit = accessories.reduce(
      (sum, accessory) => sum + accessory.profit,
      0
    );
    // Fallback: count all transactions if transactionType is missing
    let salesTransactions = await AccessoryTransaction.find({
      userId,
      transactionType: "sale",
    });
    if (!salesTransactions || salesTransactions.length === 0) {
      // Try without transactionType in case old records don't have it
      salesTransactions = await AccessoryTransaction.find({ userId });
    }
    const totalSales = salesTransactions ? salesTransactions.length : 0;
    res.status(200).json({ totalProfit, totalSales });
  } catch (error) {
    console.error("Error calculating total profit:", error);
    res
      .status(500)
      .json({ message: "Failed to calculate total profit", error });
  }
};
const handleAddAcessoryStockById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity, perPiecePrice } = req.body;
    console.log("quantity", quantity, "perPiecePrice", perPiecePrice);
    // Validate input
    if (!quantity || !perPiecePrice) {
      return res
        .status(400)
        .json({ message: "Quantity and price are required" });
    }

    if (
      isNaN(quantity) ||
      isNaN(perPiecePrice) ||
      quantity <= 0 ||
      perPiecePrice <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Quantity and price must be positive numbers" });
    }

    const accessory = await Accessory.findOne({ _id: id, userId });
    if (!accessory) {
      return res
        .status(404)
        .json({ message: "Accessory not found or unauthorized" });
    }
    // Optionally update perPiecePrice if you want to track the latest purchase price
    // Update perPiecePrice only if you want the latest purchase price to reflect in future sales.
    // If you want to keep a history of prices, consider storing each stock addition as a separate record or in a subdocument.
    // For simple use-case (latest price applies to all future sales):
    // Calculate new average perPiecePrice based on existing and added stock
    const existingStock = Number(accessory.stock);
    const existingTotalCost = Number(accessory.perPiecePrice) * existingStock;
    const addedStock = Number(quantity);
    const addedTotalCost = Number(perPiecePrice) * addedStock;
    const newTotalStock = existingStock + addedStock;
    const newTotalCost = existingTotalCost + addedTotalCost;
    accessory.perPiecePrice =
      newTotalStock > 0 ? newTotalCost / newTotalStock : Number(perPiecePrice);
    // Update stock and total price
    accessory.stock += Number(quantity);
    accessory.totalPrice += Number(perPiecePrice) * Number(quantity);
    await accessory.save();

    res
      .status(200)
      .json({ message: "Accessory stock updated successfully", accessory });
  } catch (error) {
    console.error("Error updating accessory stock:", error);
    res.status(500).json({
      message: "Failed to update accessory stock",
      error: error.message,
    });
  }
};
module.exports = {
  createAccessory,
  getAllAccessories,
  sellMultipleAccessories,
  getAllTransactions,
  deleteAccessory,
  getAccessoriesData,
  handleAddAcessoryStockById,
};
