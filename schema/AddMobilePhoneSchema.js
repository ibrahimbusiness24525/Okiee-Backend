const mongoose = require("mongoose");

const AddPhoneSchema = new mongoose.Schema({
  images: {
    type: [String],
    required: true,
    validate: [arrayLimit, '{PATH} exceeds the limit of 5']
  },
  companyName: {
    type: String,
    required: true,
  },
  modelSpecifications: {
    type: String,
    required: true,
  },  
  modelSpecifications: {
    type: String,
    required: true,
  },  
  specs: {
    type: String,
    required: true,
  },  
  imei: {
    type: String,
    required: true,
  },
  demandPrice: {
    type: Number,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  imei2: {
    type: String,
    required: false,
  },
  finalPrice: {
    type: Number,
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required:true
  },
  color:{
    type:String,
    required:true
  }
});

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model("AddPhone", AddPhoneSchema);