const {
  Accessory,
  AccessoryTransaction,
} = require("../schema/accessorySchema");
const { AddBankAccount, BankTransaction } = require("../schema/BankAccountSchema");
const { PocketCashSchema, PocketCashTransactionSchema } = require("../schema/PocketCashSchema");

// CREATE a new accessory
const createAccessory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessoryName, quantity, perPiecePrice, givePayment } = req.body;

    // Validate required fields
    if (!accessoryName || !quantity || !perPiecePrice) {
      return res.status(400).json({ message: "Accessory name, quantity, and price are required" });
    }

    // Validate numeric values
    if (isNaN(quantity) || isNaN(perPiecePrice) || quantity <= 0 || perPiecePrice <= 0) {
      return res.status(400).json({ message: "Quantity and price must be positive numbers" });
    }

    const totalPrice = quantity * perPiecePrice;

    // Handle bank payment if provided
    if (givePayment?.bankAccountUsed) {
      const bank = await AddBankAccount.findById(givePayment.bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Validate amount
      if (!givePayment.amountFromBank || isNaN(givePayment.amountFromBank) || givePayment.amountFromBank <= 0) {
        return res.status(400).json({ message: "Invalid amount from bank" });
      }

      if (givePayment.amountFromBank > bank.accountCash) {
        return res.status(400).json({ message: "Insufficient funds in bank account" });
      }

      // Deduct purchase amount from account
      bank.accountCash -= Number(givePayment.amountFromBank);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: userId,
        reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,
        amount: givePayment.amountFromBank,
        accountCash: bank.accountCash,
        accountType: bank.accountType,
        transactionType: 'debit',
        details: {
          accessoryName,
          quantity,
          totalPrice
        }
      });
    }

    // Handle pocket payment if provided
    if (givePayment?.amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({ userId });
      if (!pocketTransaction) {
        return res.status(404).json({ message: 'Pocket cash account not found.' });
      }

      // Validate amount
      if (isNaN(givePayment.amountFromPocket) || givePayment.amountFromPocket <= 0) {
        return res.status(400).json({ message: 'Invalid pocket cash amount' });
      }

      if (givePayment.amountFromPocket > pocketTransaction.accountCash) {
        return res.status(400).json({ message: 'Insufficient pocket cash' });
      }

      // Deduct amount from pocket
      pocketTransaction.accountCash -= Number(givePayment.amountFromPocket);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: userId,
        pocketCashId: pocketTransaction._id,
        amountDeducted: givePayment.amountFromPocket,
        accountCash: pocketTransaction.accountCash,
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `Purchasing accessory: ${accessoryName}`,
        details: {
          accessoryName,
          quantity,
          totalPrice
        }
      });
    }

    // Create the new accessory
    const newAccessory = await Accessory.create({
      userId,
      accessoryName,
      quantity,
      perPiecePrice,
      totalPrice,
      stock: quantity,
    });

    res.status(201).json({
      message: "Accessory created successfully",
      accessory: newAccessory
    });
  } catch (error) {
    console.error("Error creating accessory:", error);
    res.status(500).json({
      message: "Failed to create accessory",
      error: error.message
    });
  }
};

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
      if (typeof Number(getPayment.amountFromBank) !== 'number' || Number(getPayment.amountFromBank) <= 0) {
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
        transactionType: 'credit'
      });
    }

    // Handle pocket cash if provided
    if (getPayment?.amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({ userId: userId });
      if (!pocketTransaction) {
        return res.status(404).json({ message: 'Pocket cash account not found.' });
      }

      if (typeof Number(getPayment.amountFromPocket) !== 'number' || Number(getPayment.amountFromPocket) <= 0) {
        return res.status(400).json({ message: 'Invalid pocket cash amount' });
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
        return res.status(400).json({ message: "Missing required fields in sale item" });
      }

      if (quantity <= 0 || perPiecePrice <= 0) {
        return res.status(400).json({ message: "Quantity and price must be positive numbers" });
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
        transactionType: 'sale'
      });

      // Update stock
      accessory.stock -= quantity;
      await accessory.save();

      transactions.push(transaction);
    }

    res.status(201).json({ message: "Accessories sold successfully", transactions });
  } catch (error) {
    console.error("Error selling accessories:", error);
    res.status(500).json({ message: "Failed to sell accessories", error: error.message });
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

module.exports = {
  createAccessory,
  getAllAccessories,
  sellMultipleAccessories,
  getAllTransactions,
  deleteAccessory,
};
