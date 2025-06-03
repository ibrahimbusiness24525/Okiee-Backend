// controllers/creditController.js
const { Person, CreditTransaction } = require("../schema/PayablesAndReceiveablesSchema");

// 1. Create a Person
exports.createPerson = async (req, res) => {
  try {
    const { name, number, reference } = req.body;
    const userId = req.user.id;

    const newPerson = new Person({ userId, name, number, reference });
    await newPerson.save();

    res.status(201).json({ message: "Person created successfully", person: newPerson });
  } catch (error) {
    res.status(500).json({ message: "Error creating person", error });
  }
};

// 2. Give Credit
exports.giveCredit = async (req, res) => {
  try {
    const { personId, amount } = req.body;
    const userId = req.user.id;

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

    const status = updatedTaking > 0 ? "Payable" : (updatedGiving > 0 ? "Receivable" : "Settled");

    person.givingCredit = updatedGiving;
    person.takingCredit = updatedTaking;
    person.status = status;
    await person.save();

    await CreditTransaction.create({ userId, personId, givingCredit: amount });

    res.status(200).json({ message: "Credit given successfully", person });
  } catch (error) {
    res.status(500).json({ message: "Error in giving credit", error });
  }
};

// 3. Take Credit
exports.takeCredit = async (req, res) => {
  try {
    const { personId, amount } = req.body;
    const userId = req.user.id;

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

    const status = updatedTaking > 0 ? "Payable" : (updatedGiving > 0 ? "Receivable" : "Settled");

    person.givingCredit = updatedGiving;
    person.takingCredit = updatedTaking;
    person.status = status;
    await person.save();

    await CreditTransaction.create({ userId, personId, takingCredit: amount });

    res.status(200).json({ message: "Credit taken successfully", person });
  } catch (error) {
    res.status(500).json({ message: "Error in taking credit", error });
  }
};

// 4. Get All Persons with Total Credit Info
exports.getAllPersons = async (req, res) => {
  try {
    const userId = req.user.id;
    const persons = await Person.find({ userId }).sort({ createdAt: -1 });
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

    const transactions = await CreditTransaction.find({ personId: id, userId }).sort({ createdAt: -1 });

    res.status(200).json({ person, transactions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching person detail", error });
  }
};
