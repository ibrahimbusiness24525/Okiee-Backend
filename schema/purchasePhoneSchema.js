const mongoose = require('mongoose');

// Existing schemas
const PurchasePhoneSchema = new mongoose.Schema({
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

// Sold Phone schema


const SoldPhoneSchema = new mongoose.Schema({
  bulkPhonePurchaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BulkPhonePurchase',
    default: null  // Set default to null for single phone sales
  },
  imei1: { type: String, required: true },
  imei2: { type: String, default: null },
  salePrice: { type: Number, required: true },
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

module.exports = { Imei, RamSim, BulkPhonePurchase, PurchasePhone, SoldPhone };



// const mongoose = require('mongoose');

// const PurchasePhoneSchema = new mongoose.Schema({
//     shopid:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Shop", // Reference to the Invoice model
//         required: true, // You need to pass the invoice ID for each item
//       },
//     name: { type: String, required: true },
//     fatherName: { type: String,required: false },
//     companyName: { type: String, required: true },
//     modelName: { type: String, required: true },
//     date: { type: Date, required: true },
//     cnic: { type: String, required: true },
//     accessories: {
//         box: { type: Boolean, default: false },
//         charger: { type: Boolean, default: false },
//         handFree: { type: Boolean, default: false },
//     },
//     phoneCondition: { type: String, enum: ['New', 'Used'], required: true },
//     warranty: { 
//       type: String, 
//       required: true,
//       default: '12 month'
//   },
//     specifications: { type: String, enum: ['PTA', 'Non-PTA-FU', 'Non-PTA-JV'], required: true },
//     ramMemory: { type: String, required: true },
//     color: { type: String, required: false },
//     imei1: { type: String, required: true },
//     imei2: { type: String, required: false },
//     phonePicture: { type: String, required: false }, // File URL
//     personPicture: { type: String, required: false }, // File URL
//     mobileNumber: { type: String, required: true },
//     price: {
//         purchasePrice: { type: Number, required: true },
//         finalPrice: { type: Number, required: false },
//         demandPrice: { type: Number, required: false },
//     },
//     isApprovedFromEgadgets: { type: Boolean, default: false },
//     eGadgetStatusPicture: { type: String, required: false }, // File URL
// });

// const ImeiSchema = new mongoose.Schema({
//   imei1: { type: String, required: true },
//   imei2: { type: String, required: false },
//   ramSimId: { type: mongoose.Schema.Types.ObjectId, ref: "RamSim", required: true },
// });

// const RamSimSchema = new mongoose.Schema({
//   ramMemory: { type: String, required: true },
//   simOption: { type: String, required: true },
//   bulkPhonePurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "BulkPhonePurchase", required: true },
//   imeiNumbers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Imei" }],
// });

// const BulkPhonePurchaseSchema = new mongoose.Schema({
//   partyName: { type: String,},
//   date: { type: Date,},
//   companyName: { type: String, },
//   modelName: { type: String,},
//   prices: {
//     buyingPrice: { type: String},
//     dealerPrice: { type: String},  
//     lp: { type: Number, required: false },
//     lifting: { type: Number, required: false },
//     promo: { type: String, required: false },
//     activation: { type: String, required: false },
//   },
//   ramSimDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "RamSim" }],
// });

// const Imei = mongoose.model("Imei", ImeiSchema);
// const RamSim = mongoose.model("RamSim", RamSimSchema);
// const BulkPhonePurchase = mongoose.model("BulkPhonePurchase", BulkPhonePurchaseSchema);
// const PurchasePhone = mongoose.model('PurchasePhone', PurchasePhoneSchema);

// module.exports = { Imei, RamSim, BulkPhonePurchase, PurchasePhone };


