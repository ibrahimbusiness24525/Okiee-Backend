const mongoose = require("mongoose");
const { ExpenseType, Expense } = require("../schema/ExpenseSchema");

// Create a new expense type
exports.createExpenseType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Expense type name is required",
      });
    }

    const existing = await ExpenseType.findOne({
      userId,
      name: name.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Expense type with this name already exists",
      });
    }

    const expenseType = await ExpenseType.create({
      userId,
      name: name.trim(),
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Expense type created successfully",
      data: expenseType,
    });
  } catch (error) {
    console.error("Error creating expense type:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all expense types for the user
exports.getExpenseTypes = async (req, res) => {
  try {
    const userId = req.user.id;

    const types = await ExpenseType.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: types.length,
      data: types,
    });
  } catch (error) {
    console.error("Error fetching expense types:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create a new expense
exports.createExpense = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const userId = req.user.id;
      const { expenseTypeId, price, note, date } = req.body;

      if (!expenseTypeId) {
        throw new Error("Expense type is required");
      }
      if (price === undefined || price === null || Number(price) < 0) {
        throw new Error("Price is required and must be 0 or greater");
      }

      const type = await ExpenseType.findOne({
        _id: expenseTypeId,
        userId,
      });

      if (!type) {
        throw new Error("Expense type not found");
      }

      const expense = await Expense.create(
        [
          {
            userId,
            expenseType: expenseTypeId,
            price: Number(price),
            note: note || "",
            date: date ? new Date(date) : new Date(),
          },
        ],
        { session }
      );

      const populated = await Expense.findById(expense[0]._id)
        .populate("expenseType", "name description")
        .session(session);

      return res.status(201).json({
        success: true,
        message: "Expense created successfully",
        data: populated,
      });
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// Get all expenses for the user (optionally filter by type or date range)
exports.getUserExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { expenseTypeId, startDate, endDate } = req.query;

    const query = { userId };

    if (expenseTypeId) {
      query.expenseType = expenseTypeId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const expenses = await Expense.find(query)
      .populate("expenseType", "name description")
      .sort({ date: -1, createdAt: -1 });

    const totalAmount = expenses.reduce(
      (sum, e) => sum + Number(e.price || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: expenses.length,
      totalAmount,
      data: expenses,
    });
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
