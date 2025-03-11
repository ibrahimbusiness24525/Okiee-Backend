const express = require('express');

const router = express.Router();

const { getToDayBook } = require('../controllers/dayBookController');
const { decoderMiddleware } = require('../services/authServices');

// Route to get today's ledger
router.get('/todayBook', decoderMiddleware, getToDayBook);

module.exports = router;