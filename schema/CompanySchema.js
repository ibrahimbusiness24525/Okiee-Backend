const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  modelName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Model",
    required: false
  }
}, { timestamps: true });

const ModelNameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  }
}, { timestamps: true });

const Company = mongoose.model("Company", CompanySchema);
const Model = mongoose.model("Model", ModelNameSchema);

module.exports = { Company, Model };
