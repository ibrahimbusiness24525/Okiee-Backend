const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    modelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: false,
    },
  },
  { timestamps: true }
);

// This ensures names are unique per user but can be duplicated across different users
CompanySchema.index({ name: 1, userId: 1 }, { unique: true });

const ModelNameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", CompanySchema);
const Model = mongoose.model("Model", ModelNameSchema);

module.exports = { Company, Model };
