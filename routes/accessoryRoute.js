const express = require("express");
const {
  createAccessory,
  getAllAccessories,
  getAllTransactions,
  deleteAccessory,
  sellMultipleAccessories,
} = require("../controllers/accessoryController");
const { decoderMiddleware } = require("../services/authServices");

const router = express.Router();

router.use(decoderMiddleware); // all routes below require authentication

router.post("/create", createAccessory);
router.get("/", getAllAccessories);
router.post("/sell", sellMultipleAccessories);
router.get("/transactions", getAllTransactions);
router.delete("/:id", deleteAccessory);

module.exports = router;
