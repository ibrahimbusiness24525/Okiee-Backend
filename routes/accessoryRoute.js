const express = require("express");
const {
  createAccessory,
  getAllAccessories,
  getAllTransactions,
  deleteAccessory,
  sellMultipleAccessories,
  handleAddAcessoryStockById,
  getAccessoriesPersonRecord,
  deleteAccessoryById,
  getAccessoriesPersonPurchaseRecord,
} = require("../controllers/accessoryController");
const { decoderMiddleware } = require("../services/authServices");
const { getAccessoriesData } = require("../controllers/accessoryController");

const router = express.Router();

router.use(decoderMiddleware); // all routes below require authentication

router.post("/create", createAccessory);
router.get("/", getAllAccessories);
router.post("/sell", sellMultipleAccessories);
router.get("/transactions", getAllTransactions);
router.get("/data", getAccessoriesData);
router.delete("/:id", deleteAccessory);
router.post("/:id", handleAddAcessoryStockById);
router.get("/accessoryRecord", getAccessoriesPersonRecord);
router.get("/accessoryRecord/purchase", getAccessoriesPersonPurchaseRecord);
router.delete("/:id", deleteAccessoryById);

module.exports = router;
