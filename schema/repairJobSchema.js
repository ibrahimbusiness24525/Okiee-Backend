const mongoose = require("mongoose");

const RepairJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Customer Information
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ["existing", "new"],
      required: true,
    },
    // Device Information
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },
    // Dates
    receivedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.receivedDate;
        },
        message: "Delivery date must be after received date",
      },
    },
    // Issue Description
    faultIssue: {
      type: String,
      required: true,
      trim: true,
    },
    // Checkboxes
    isPhoneReceived: {
      type: Boolean,
      default: false,
    },
    isDeadApproval: {
      type: Boolean,
      default: false,
    },
    // Parts
    parts: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Payment
    estimatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Profit (calculated: estimatedAmount - total parts price)
    profit: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentType: {
      type: String,
      enum: ["full", "credit"],
      required: true,
    },
    // Credit Payment Details (only if paymentType is "credit")
    advance: {
      type: Number,
      required: function () {
        return this.paymentType === "credit";
      },
      min: 0,
    },
    payLate: {
      type: Number,
      required: function () {
        return this.paymentType === "credit";
      },
      min: 0,
    },
    // Status
    status: {
      type: String,
      enum: ["todo", "in-progress", "complete", "handover"],
      default: "todo",
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate payLate if paymentType is credit
RepairJobSchema.pre("save", function (next) {
  if (this.paymentType === "credit" && this.advance !== undefined) {
    this.payLate = this.estimatedAmount - this.advance;
  }
  // Calculate profit = estimatedAmount - total parts price
  if (Array.isArray(this.parts) && this.parts.length > 0) {
    const totalPartsPrice = this.parts.reduce(
      (sum, part) => sum + Number(part.price || 0),
      0
    );
    this.profit = Math.max(0, this.estimatedAmount - totalPartsPrice);
  } else {
    this.profit = this.estimatedAmount;
  }
  next();
});

// Index for better query performance
RepairJobSchema.index({ userId: 1, status: 1 });
RepairJobSchema.index({ customerNumber: 1, userId: 1 });

const RepairJob = mongoose.model("RepairJob", RepairJobSchema);

module.exports = RepairJob;
