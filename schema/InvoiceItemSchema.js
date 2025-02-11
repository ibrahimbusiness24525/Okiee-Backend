const mongoose = require("mongoose");

// Define the schema for individual items in an invoice
const InvoiceItemSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
  },
  mobileId: { // Fixed name to avoid duplicate key issue
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchasePhone",
    required: true,
  },
  mobileName: {
    type: String,
    required: true,
  },
  purchaseAmount: {
    type: String,
    required: true,
  },
  mobileCompany: {
    type: String,
    required: true,
  },
  imei: {
    type: String,
    required: true,
  },
  imei2: {
    type: String,
    required: false,
  },
  warranty: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
});

// Define the schema for an invoice
const InvoiceSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  items: [InvoiceItemSchema], // List of invoice items
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Export the Invoice model
module.exports = mongoose.model("Invoice", InvoiceSchema);
