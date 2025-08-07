// controllers/creditController.js
const {
  AddBankAccount,
  BankTransaction,
} = require("../schema/BankAccountSchema");
const {
  Person,
  CreditTransaction,
} = require("../schema/PayablesAndReceiveablesSchema");
const {
  PocketCashSchema,
  PocketCashTransactionSchema,
} = require("../schema/PocketCashSchema");

// 1. Create a Person
exports.createPerson = async (req, res) => {
  try {
    const { name, number, reference } = req.body;
    const userId = req.user.id;

    const newPerson = new Person({ userId, name, number, reference });
    await newPerson.save();

    res
      .status(201)
      .json({ message: "Person created successfully", person: newPerson });
  } catch (error) {
    res.status(500).json({ message: "Error creating person", error });
  }
};

// 2. Give Credit
exports.giveCredit = async (req, res) => {
  try {
    const { personId, amount, description, giveCredit } = req.body;
    const userId = req.user.id;
    console.log("give credit", giveCredit);
    if (giveCredit?.bankAccountUsed) {
      const bank = await AddBankAccount.findById(giveCredit?.bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Deduct purchasePrice from accountCash
      bank.accountCash -= Number(giveCredit?.amountFromBank);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        reasonOfAmountDeduction: `give credit to person: ${personId}, amount: ${amount}`,
        accountCash: amount,
        accountType: bank.accountType,
      });
    }
    console.log("giveCredit", giveCredit);
    if (giveCredit?.amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (giveCredit?.amountFromPocket > pocketTransaction.accountCash) {
        return res.status(400).json({ message: "Insufficient pocket cash" });
      }

      pocketTransaction.accountCash -= Number(giveCredit?.amountFromPocket);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id, // if you want to associate it
        amountDeducted: giveCredit?.amountFromPocket,
        accountCash: pocketTransaction.accountCash, // ✅ add this line
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `give credit to person: ${personId}, amount: ${amount}`,
      });
    }
    const person = await Person.findOne({ _id: personId, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });

    let updatedGiving = person.givingCredit + amount;
    let updatedTaking = person.takingCredit;

    if (person.takingCredit > 0) {
      const diff = person.takingCredit - amount;
      if (diff >= 0) {
        updatedTaking = diff;
        updatedGiving = person.givingCredit;
      } else {
        updatedTaking = 0;
        updatedGiving = person.givingCredit + Math.abs(diff);
      }
    }

    const status =
      updatedTaking > 0
        ? "Payable"
        : updatedGiving > 0
        ? "Receivable"
        : "Settled";

    person.givingCredit = updatedGiving;
    person.takingCredit = updatedTaking;
    person.status = status;
    await person.save();

    await CreditTransaction.create({
      userId,
      personId,
      givingCredit: amount,
      description,
    });

    res.status(200).json({ message: "Credit given successfully", person });
  } catch (error) {
    res.status(500).json({ message: "Error in giving credit", error });
  }
};

// 3. Take Credit
exports.takeCredit = async (req, res) => {
  try {
    const { personId, amount, description, takeCredit } = req.body;
    const userId = req.user.id;
    if (takeCredit?.bankAccountUsed) {
      const bank = await AddBankAccount.findById(takeCredit?.bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Deduct purchasePrice from accountCash
      bank.accountCash += Number(takeCredit?.amountFromBank);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        reasonOfAmountDeduction: `take credit from person: ${personId}, amount: ${amount}`,
        accountCash: amount,
        accountType: bank.accountType,
      });
    }
    console.log("giveCredit", takeCredit);
    if (takeCredit?.amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (takeCredit?.amountFromPocket > pocketTransaction.accountCash) {
        return res.status(400).json({ message: "Insufficient pocket cash" });
      }

      pocketTransaction.accountCash += Number(takeCredit?.amountFromPocket);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id, // if you want to associate it
        amountDeducted: takeCredit?.amountFromPocket,
        accountCash: pocketTransaction.accountCash, // ✅ add this line
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `take credit from person: ${personId}, amount: ${amount}`,
      });
    }

    const person = await Person.findOne({ _id: personId, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });

    let updatedTaking = person.takingCredit + amount;
    let updatedGiving = person.givingCredit;

    if (person.givingCredit > 0) {
      const diff = person.givingCredit - amount;
      if (diff >= 0) {
        updatedGiving = diff;
        updatedTaking = person.takingCredit;
      } else {
        updatedGiving = 0;
        updatedTaking = person.takingCredit + Math.abs(diff);
      }
    }

    const status =
      updatedTaking > 0
        ? "Payable"
        : updatedGiving > 0
        ? "Receivable"
        : "Settled";

    person.givingCredit = updatedGiving;
    person.takingCredit = updatedTaking;
    person.status = status;
    await person.save();

    await CreditTransaction.create({
      userId,
      personId,
      takingCredit: amount,
      description,
    });

    res.status(200).json({ message: "Credit taken successfully", person });
  } catch (error) {
    res.status(500).json({ message: "Error in taking credit", error });
  }
};

// 4. Get All Persons with Total Credit Info
exports.getAllPersons = async (req, res) => {
  try {
    const userId = req.user.id;

    const persons = await Person.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(persons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching persons", error });
  }
};

// 5. Get Person Detail by ID
exports.getPersonDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const person = await Person.findOne({ _id: id, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });
    

    const transactions = await CreditTransaction.find({
      personId: id,
      userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ person, transactions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching person detail", error });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Transaction ID is required" });
    
    const transaction = await CreditTransaction.findOne({ 
      _id: id, 
      userId: req.user.id // Fixed: use req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await CreditTransaction.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });
    
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deletingg transaction:", error);
    res.status(500).json({ message: "Error deleting transaction", error: error.message });
  }
};
exports.getAllPersonsNameAndId = async (req, res) => {
  try {
    const userId = req.user.id;
    const persons = await Person.find({ userId })
      .select("name _id number")
      .sort({ createdAt: -1 });
    res.status(200).json(persons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching persons", error });
  }
};

exports.deletePerson = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const person = await Person.findOneAndDelete({ _id: id, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });

    res.status(200).json({ message: "Person deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting person", error });
  }
};
exports.toggleFavouritePerson = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const person = await Person.findOne({ _id: id, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });

    person.favourite = !person.favourite;
    await person.save();

    res.status(200).json({ message: "Favourite status toggled", person });
  } catch (error) {
    res.status(500).json({ message: "Error toggling favourite status", error });
  }
};

exports.updatePerson = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, number, reference } = req.body;

    const person = await Person.findOne({ _id: id, userId });
    if (!person) return res.status(404).json({ message: "Person not found" });

    person.name = name;
    person.number = number;
    person.reference = reference;
    await person.save();

    res.status(200).json({ message: "Person updated successfully", person });
  } catch (error) {
    res.status(500).json({ message: "Error updating person", error });
  }
};
