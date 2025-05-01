const express = require('express');
const { getTotalPocketCash, addCash, deductCash } = require('../controllers/pocketCashController');
const { decoderMiddleware } = require("../services/authServices");
const router = express.Router();

router.get('/total', decoderMiddleware, getTotalPocketCash);
router.post('/add', decoderMiddleware, addCash);
router.post('/deduct', decoderMiddleware, deductCash);

module.exports = router;
