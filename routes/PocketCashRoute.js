const express = require('express');
const { getTotalPocketCash, addCash, deductCash, getPocketCashTransactions } = require('../controllers/pocketCashController');
const { decoderMiddleware } = require("../services/authServices");
const router = express.Router();

router.get('/total', decoderMiddleware, getTotalPocketCash);
router.post('/add', decoderMiddleware, addCash);
router.post('/deduct', decoderMiddleware, deductCash);
router.get('/get', decoderMiddleware, getPocketCashTransactions);

module.exports = router;
