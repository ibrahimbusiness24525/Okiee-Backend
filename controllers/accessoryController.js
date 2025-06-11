const {
  Accessory,
  AccessoryTransaction,
} = require("../schema/accessorySchema");

// CREATE a new accessory
const createAccessory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessoryName, quantity, perPiecePrice } = req.body;
    const totalPrice = quantity * perPiecePrice;

    const newAccessory = await Accessory.create({
      userId,
      accessoryName,
      quantity,
      perPiecePrice,
      totalPrice,
      stock: quantity,
    });

    res.status(201).json(newAccessory);
  } catch (error) {
    res.status(500).json({ message: "Failed to create accessory", error });
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

    const transactions = [];

    for (const sale of sales) {
      const { accessoryId, quantity, perPiecePrice } = sale;

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
      });

      // Update stock
      accessory.stock -= quantity;
      await accessory.save();

      transactions.push(transaction);
    }

    res.status(201).json({ message: "Accessories sold", transactions });
  } catch (error) {
    res.status(500).json({ message: "Failed to sell accessories", error });
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
