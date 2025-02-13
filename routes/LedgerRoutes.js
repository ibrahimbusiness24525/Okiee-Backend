const express = require('express');
const ledgerRouter = express.Router();
const ledgerController = require('../controllers/ledgerController');

// Routes to update ledger fields
ledgerRouter.put('/update-opening-cash', ledgerController.updateOpeningCash);
ledgerRouter.post('/update-cash-received', ledgerController.updateCashReceived);
ledgerRouter.post('/update-cash-paid', ledgerController.updateCashPaid);
ledgerRouter.post('/update-expense', ledgerController.updateExpense);
ledgerRouter.get('/update-remaining/:ledgerId', ledgerController.updateRemainingCash);
ledgerRouter.get('/update-ledger/:ledgerId', ledgerController.updateLedgerRecord);
ledgerRouter.post('/end-day', ledgerController.endDay);
ledgerRouter.get('/all', ledgerController.getAllRecords);
//get ledger by id
ledgerRouter.get('/detail/:id', ledgerController.getLedgerById);

// Route to fetch today's ledger
ledgerRouter.get('/today', ledgerController.getTodaysLedger);


//archieve and create new
// ledgerRouter.get('/createNew', ledgerController.archiveAndCreateNewLedger);


module.exports = ledgerRouter;
