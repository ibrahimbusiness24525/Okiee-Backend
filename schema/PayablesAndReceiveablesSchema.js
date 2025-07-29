const { default: mongoose } = require("mongoose");

const personSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    number: { type: Number, required: true },
    favourite: { type: Boolean, default: false },
    reference: { type: String, required: true },
    takingCredit: { type: Number, default: 0 },
    givingCredit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Payable", "Receivable", "Settled"],
      default: "Settled",
    },
  },
  { timestamps: true }
);

const creditTransactionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },
    takingCredit: { type: Number, default: 0 },
    givingCredit: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Person = mongoose.model("Person", personSchema);
const CreditTransaction = mongoose.model(
  "CreditTransaction",
  creditTransactionSchema
);

module.exports = { Person, CreditTransaction };
