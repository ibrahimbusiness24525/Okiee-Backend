const express = require("express");
const {
    createAccessory,
    getAllAccessories,
    sellAccessory,
    getAllTransactions,
    deleteAccessory,
} = require("../controllers/accessoryController");
const { decoderMiddleware } = require("../services/authServices");

const router = express.Router();

router.use(decoderMiddleware); // all routes below require authentication

router.post("/create", createAccessory);
router.get("/", getAllAccessories);
router.post("/sell", sellAccessory);
router.get("/transactions", getAllTransactions);
router.delete("/:id", deleteAccessory);

module.exports = router;
