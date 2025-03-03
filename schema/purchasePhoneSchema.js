const mongoose = require('mongoose');

// Existing schemas
const PurchasePhoneSchema = new mongoose.Schema({
   userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
  shopid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  name: { type: String, required: true },
  fatherName: { type: String, required: false },
  companyName: { type: String, required: true },
  modelName: { type: String, required: true },
  date: { type: Date, required: true },
  cnic: { type: String, required: true },
  accessories: {
    box: { type: Boolean, default: false },
    charger: { type: Boolean, default: false },
    handFree: { type: Boolean, default: false },
  },
  phoneCondition: { type: String, enum: ['New', 'Used'], required: true },
  warranty: { type: String, required: true, default: '12 month' },
  specifications: { type: String, 
    // enum: ['PTA', 'Non-PTA-FU', 'Non-PTA-JV'],
     required: true },
  ramMemory: { type: String, required: true },
  color: { type: String, required: false },
  imei1: { type: String, required: true },
  imei2: { type: String, required: false },
  phonePicture: { type: String, required: false }, // File URL
  personPicture: { type: String, required: false }, // File URL
  mobileNumber: { type: String, required: true },
  price: {
    purchasePrice: { type: Number, required: true },
    finalPrice: { type: Number, required: false },
    demandPrice: { type: Number, required: false },
  },
  isApprovedFromEgadgets: { type: Boolean, default: false },
  eGadgetStatusPicture: { type: String, required: false }, // File URL
  isSold: { type: Boolean, default: false }, // Added field for sale status
  soldDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SoldPhone", // Reference to SoldPhone model
    required: false,
  },
});

const SingleSoldPhoneSchema = new mongoose.Schema({
  purchasePhoneId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchasePhone", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopid: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  customerName: { type: String, required: true },
  cnic: { type: String, required: false },
  cnicFrontPic: { type: String, required: false }, // File URL
  cnicBackPic: { type: String, required: false },  // File URL
  mobileNumber: { type: String, required: true },
  accesssoryName:{
    type: String,
    required:false
  },
  accesssoryAmount:{
    type: Number,
    required:false
  },
  sellingPaymentType: {
    type: String,
    enum: ["Bank", "Credit", "Cash", "Exchange"],
    required: [true, "Path `sellingPaymentType` is required."],
  },  
  // Phone Details
  name: { type: String, required: true },
  fatherName: { type: String, required: false },
  companyName: { type: String, required: true },
  modelName: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  saleDate: { type: Date, default: Date.now },
  phoneCondition: { type: String, enum: ["New", "Used"], required: true },

  // Warranty should be updated based on condition
  warranty: { type: String, required: true },

  specifications: { type: String, required: true },
  ramMemory: { type: String, required: true },
  color: { type: String, required: false },
  imei1: { type: String, required: true },
  imei2: { type: String, required: false },
  phonePicture: { type: String, required: false }, // File URL
  personPicture: { type: String, required: false }, // File URL

  // Accessories
  accessories: {
    box: { type: Boolean, default: false },
    charger: { type: Boolean, default: false },
    handFree: { type: Boolean, default: false },
  },

  // Pricing Details
  purchasePrice: { type: Number, required: true },
  finalPrice: { type: Number, required: false },
  demandPrice: { type: Number, required: false },

  // Approval & Invoice
  isApprovedFromEgadgets: { type: Boolean, default: false },
  eGadgetStatusPicture: { type: String, required: false }, // File URL
  invoiceNumber: { type: String, required: true, unique: true },
});

// Sold Phone schema


const SoldPhoneSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bulkPhonePurchaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BulkPhonePurchase',
    default: null  // Set default to null for single phone sales
  },
  accesssoryName:{
    type: String,
    required:false
  },
  accesssoryAmount:{
    type: Number,
    required:false
  },
  sellingPaymentType :{
    type : String,
    enum:["Bank","Credit","Cash","Exchange"],
    required:true,
  },
  customerName: { type: String, required: true },
  cnicFrontPic: { type: String, required: false }, // File URL
  cnicBackPic: { type: String, required: false },  // File
  imei1: { type: String, required: true },
  imei2: { type: String, default: null },
  salePrice: { type: Number, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  warranty: { type: String, required: true },  
  dateSold: { type: Date, default: Date.now }
});



// Imei and RamSim schemas remain unchanged
const ImeiSchema = new mongoose.Schema({
  imei1: { type: String, required: true },
  imei2: { type: String, required: false },
  ramSimId: { type: mongoose.Schema.Types.ObjectId, ref: "RamSim", required: true },
});

const RamSimSchema = new mongoose.Schema({
  ramMemory: { type: String, required: true },
  simOption: { type: String, required: true },
  bulkPhonePurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "BulkPhonePurchase", required: true },
  imeiNumbers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Imei" }],
});

const BulkPhonePurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  partyName: { type: String },
  date: { type: Date },
  companyName: { type: String },
  modelName: { type: String },
  prices: {
    buyingPrice: { type: String },
    dealerPrice: { type: String },
    lp: { type: Number, required: false },
    lifting: { type: Number, required: false },
    promo: { type: String, required: false },
    activation: { type: String, required: false },
  },
  ramSimDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "RamSim" }],
  status: { type: String, enum: ["Available", "Partially Sold", "Sold"], default: "Available" }
});

// Models
const Imei = mongoose.model("Imei", ImeiSchema);
const RamSim = mongoose.model("RamSim", RamSimSchema);
const BulkPhonePurchase = mongoose.model("BulkPhonePurchase", BulkPhonePurchaseSchema);
const PurchasePhone = mongoose.model('PurchasePhone', PurchasePhoneSchema);
const SoldPhone = mongoose.model("SoldPhone", SoldPhoneSchema);
const SingleSoldPhone = mongoose.model("SingleSoldPhone", SingleSoldPhoneSchema);

module.exports = { Imei, RamSim, BulkPhonePurchase, PurchasePhone, SoldPhone,SingleSoldPhone };





