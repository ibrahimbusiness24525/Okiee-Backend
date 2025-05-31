const express = require('express');
const router = express.Router();
const {
  createEntity,
  addLedgerEntry,
  getEntityLedger,
  getAllEntities
} = require('../controllers/ShopLedgerControllers');
const { decoderMiddleware } = require('../services/authServices');

router.post('/create', decoderMiddleware, createEntity);
router.post('/ledger', decoderMiddleware, addLedgerEntry);
router.get('/:entityId/ledger', decoderMiddleware, getEntityLedger);
router.get('/:entityId/ledger', decoderMiddleware, getEntityLedger);
router.get('/entities', decoderMiddleware, getAllEntities); //
module.exports = router;
