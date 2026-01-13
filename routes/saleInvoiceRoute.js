const express = require("express");
const router = express.Router();
const saleInvoiceController = require("../controllers/saleInvoiceController");
const { decoderMiddleware } = require("../services/authServices");

// Apply authentication middleware to all routes
router.use(decoderMiddleware);

// Get all invoices
router.get("/", saleInvoiceController.getAllInvoices);

// Get invoice statistics
router.get("/statistics", saleInvoiceController.getInvoiceStatistics);

// Get invoice by ID
router.get("/:id", saleInvoiceController.getInvoiceById);

// Get invoice by invoice number
router.get("/number/:invoiceNumber", saleInvoiceController.getInvoiceByNumber);

// Get detailed phone information by invoice number
router.get(
  "/phone-details/:invoiceNumber",
  saleInvoiceController.getPhoneDetailsByInvoiceNumber
);

// Return/Refund invoice
router.post("/:id/return", saleInvoiceController.returnInvoice);

// Add phone to invoice
router.put("/:id/add-phone", saleInvoiceController.addPhoneToInvoice);

// Delete invoice
router.delete("/:id", saleInvoiceController.deleteInvoice);

module.exports = router;
