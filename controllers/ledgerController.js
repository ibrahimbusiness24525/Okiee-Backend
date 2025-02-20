const { default: mongoose } = require('mongoose');
const Ledger = require('../schema/LedgerSchema');

// Update opening cash
exports.updateOpeningCash = async (req, res) => {
  const { amount } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const userId = req.user.id; // Ensure this is the logged-in user's ID
  console.log("Updating points for user:", userId);
  try {
    if (amount < 0) {
      return res.status(400).json({ message: "Opening cash cannot be negative!" });
    }

    let ledger = await Ledger.findOneAndUpdate({ date: today, userId: req.user.id });

    if (!ledger) {
      // Create a new ledger record if not found
      ledger = new Ledger({
        userId: req.user.id,
        date: today,
        openingCash: amount,
      });

      await ledger.save();
      return res.status(201).json({ message: "New ledger record created!", ledger });
    }

    ledger.openingCash = amount;
    await ledger.save();

    return res.status(200).json({ message: "Opening cash updated successfully!", ledger });
  } catch (error) {
    return res.status(500).json({ message: "Error updating opening cash", error });
  }
};


// Get all ledger records

exports.getAllRecords = async (req, res) => {
    try {
      const records = await Ledger.find({userId: req.user.id}).sort({ date: -1 }); // Sort records by date in descending order
      return res.status(200).json({ message: 'Ledger records fetched successfully!', records });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching ledger records', error });
    }
  };

  exports.getLedgerById = async (req, res) => {
    const { id } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ledger ID format!" });
    }
    try {
      // Validate ObjectId format before querying
      
      const ledger = await Ledger.findById(id);
  
      if (!ledger) {
        return res.status(404).json({ message: "Ledger record not found!" });
      }
  
      return res.status(200).json({
        message: "Ledger details fetched successfully!",
        ledger,
      });
    } catch (error) {
      console.error("Error fetching ledger record by ID:", error);
      return res.status(500).json({
        message: "Error fetching the ledger record",
        error: error.message,
      });
    }
  };
  
// Update Cash Received
exports.updateCashReceived = async (req, res) => {
  const { amount, source } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    let ledger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!ledger) {
      ledger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: today
      });
    }

    ledger.cashReceived += amount;
    ledger.cashReceivedDetails.push({ amount, source, date: new Date() });

    await ledger.save();
    return res.status(200).json({ message: 'Cash received updated successfully!', ledger });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating cash received', error });
  }
};

// Update Cash Paid
exports.updateCashPaid = async (req, res) => {
  const { amount, recipient } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    let ledger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!ledger) {
      ledger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: today
      });
    }

    ledger.cashPaid += amount;
    ledger.cashPaidDetails.push({ amount, recipient, date: new Date() });

    await ledger.save();
    return res.status(200).json({ message: 'Cash paid updated successfully!', ledger });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating cash paid', error });
  }
};

// Update Expenses
exports.updateExpense = async (req, res) => {
  const { amount, purpose } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    let ledger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!ledger) {
      ledger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: today
      });
    }

    ledger.expense += amount;
    ledger.expenseDetails.push({ amount, purpose, date: new Date() });

    await ledger.save();
    return res.status(200).json({ message: 'Expense updated successfully!', ledger });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating expense', error });
  }
};




exports.getTodaysLedger = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    let ledger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!ledger) {
      ledger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: today
      });
      await ledger.save();
    }

    return res.status(200).json({ message: 'Today’s ledger record fetched successfully!', ledger });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching today’s ledger record', error });
  }
};

// Archive and Create New Ledger
exports.archiveAndCreateNewLedger = async (req,res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = tomorrow.toISOString().split('T')[0];

    let todayLedger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!todayLedger) {
      todayLedger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        archived: true,
        date: today
      });
      await todayLedger.save();
    } else {
      todayLedger.archived = true;
      await todayLedger.save();
    }

    const existingLedger = await Ledger.findOne({ date: nextDay, userId: req.user.id });
    if (!existingLedger) {
      const newLedger = new Ledger({
        openingCash: todayLedger.closingCash,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: nextDay
      });
      await newLedger.save();
      console.log('New ledger created for', nextDay);
    } else {
      console.log('Ledger for the next day already exists.');
    }
  } catch (error) {
    console.error('Error archiving and creating new ledger:', error);
  }
};

// Update Remaining Cash
exports.updateRemainingCash = async (req, res) => {
  try {
    const { ledgerId } = req.params;
    const ledger = await Ledger.findOne({_id:ledgerId, userId: req.user.id});

    if (!ledger) {
      return res.status(404).json({ message: "Ledger record not found!" });
    }

    // Calculate total received, paid, and expense from the arrays
    const totalReceived = ledger.cashReceivedDetails.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = ledger.cashPaidDetails.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = ledger.expenseDetails.reduce((sum, item) => sum + item.amount, 0);

    // Update closing cash
    ledger.closingCash = ledger.openingCash + totalReceived - totalPaid - totalExpense;
    await ledger.save();

    return res.status(200).json({ 
      message: "Remaining cash updated successfully!", 
      remainingCash: ledger.closingCash 
    });
  } catch (error) {
    console.error('Error updating remaining cash:', error);
    return res.status(500).json({ message: 'Error updating remaining cash', error });
  }
};


// Update Ledger Record
exports.updateLedgerRecord = async (req, res) => {
  const { ledgerId } = req.params;
  const { field, value } = req.body;

  try {
    const ledger = await Ledger.findOne({ _id: ledgerId, userId: req.user.id });
    if (!ledger) {
      return res.status(404).json({ message: "Ledger record not found!" });
    }

    const allowedFields = ["openingCash", "cashReceived", "cashPaid", "expense", "closingCash"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: `Invalid field: ${field}. Allowed fields are: ${allowedFields.join(", ")}` });
    }

    ledger[field] = value;
    await ledger.save();

    return res.status(200).json({ message: `Ledger ${field} updated successfully!`, ledger });
  } catch (error) {
    return res.status(500).json({ message: "Error updating ledger", error });
  }
};

// End Day
exports.endDay = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = tomorrow.toISOString().split('T')[0];

    let todayLedger = await Ledger.findOne({ date: today, userId: req.user.id });

    if (!todayLedger) {
      todayLedger = new Ledger({
        openingCash: 0,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        archived: true,
        date: today
      });
      await todayLedger.save();
      return res.status(404).json({ message: 'No ledger record found for today! A new empty ledger was created.' });
    }

    todayLedger.archived = true;
    await todayLedger.save();

    const existingLedger = await Ledger.findOne({ date: nextDay, userId: req.user.id });
    if (!existingLedger) {
      const newLedger = new Ledger({
        openingCash: todayLedger.closingCash,
        cashReceived: 0,
        cashPaid: 0,
        expense: 0,
        closingCash: 0,
        cashReceivedDetails: [],
        cashPaidDetails: [],
        expenseDetails: [],
        date: nextDay
      });
      await newLedger.save();
      return res.status(201).json({ message: `New ledger created for ${nextDay}` });
    }
    res.status(200).json({ message: `Ledger for ${nextDay} already exists` });
  } catch (error) {
    console.error('Error updating ledger:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
