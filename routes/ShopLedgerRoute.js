const express = require('express');
const router = express.Router();
const {
  createEntity,
  addLedgerEntry,
  getEntityLedger,
  getAllEntities
} = require('../controllers/ShopLedgerControllers');

router.post('/', createEntity);
router.post('/ledger', addLedgerEntry);
router.get('/:entityId/ledger', getEntityLedger);
router.get('/:entityId/ledger', getEntityLedger);
router.get('/entities', getAllEntities); //
module.exports = router;
