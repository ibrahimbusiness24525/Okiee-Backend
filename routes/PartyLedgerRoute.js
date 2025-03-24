const { createParty, getAllPartyNames, getAllPartiesRecords, getBulkPurchasesByPartyId } = require("../controllers/partyLedgerControllers");
const PartyLedger = require("../schema/PartyLedgerSchema");
const { decoderMiddleware } = require("../services/authServices");
const ModelValidator = require("../validators/ModelValidator");
const express = require('express');

const router =  express.Router();

router.post(
    "/create",
    // ModelValidator(PartyLedger),
    decoderMiddleware,
    createParty
)
router.get(
    "/getAllNames",
    decoderMiddleware,
    getAllPartyNames
)

router.get(
    "/getAllPartiesRecords",
    decoderMiddleware,
    getAllPartiesRecords
)
router.get(
    "/getBulkPurchaseById/:id",
    decoderMiddleware,
    getBulkPurchasesByPartyId
)

module.exports = router;