const mongoose = require("mongoose");

// Define the schema for individual items in an invoice
const InvoiceItemSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  mobileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AddPhone", // Reference to the Invoice model
    required: true, // You need to pass the invoice ID for each item
  },
  mobileName:{
    type:String,
    required:true
  },
  mobileCompany:{
    type:String,
    required:true
  },
  warranty:{
    type:String,
    required:true
  },
  quantity: {
    type: Number,
    required: true,
    default:1,
    min: 1, // Ensure at least 1 quantity
  },
});

// Define the schema for an invoice
const InvoiceSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User model (shop)
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
  items: [InvoiceItemSchema], // List of Invoice Items
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Export the Invoice model
module.exports = mongoose.model("Invoice", InvoiceSchema);
