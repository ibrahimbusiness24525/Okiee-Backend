const { Entity, ShopLedger } = require('../schema/ShopLedgerSchema');

// Create a new entity (linked to the user)
const createEntity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, reference } = req.body;
    const entity = new Entity({ userId, name, reference });
    await entity.save();
    res.status(201).json({ message: "Entity created", entity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a ledger entry (linked to user and entity)
const addLedgerEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entityId, type, amount, description } = req.body;

    if (!['Expense', 'CashPaid', 'CashReceived'].includes(type)) {
      return res.status(400).json({ message: "Invalid entry type" });
    }

    const entry = new ShopLedger({ userId, entityId, type, amount, description });
    await entry.save();
    res.status(201).json({ message: `${type} recorded`, entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all ledger entries for a specific entity (user-specific)
const getEntityLedger = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entityId } = req.params;

    const entity = await Entity.findOne({ _id: entityId, userId });
    if (!entity) return res.status(404).json({ message: "Entity not found" });

    const entries = await ShopLedger.find({ entityId, userId }).sort({ date: -1 });
    res.status(200).json({ entity, entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all entities for a specific user
const getAllEntities = async (req, res) => {
  try {
    const userId = req.user.id;
    const entities = await Entity.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ entities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEntity,
  addLedgerEntry,
  getEntityLedger,
  getAllEntities
};
