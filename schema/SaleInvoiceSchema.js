const mongoose = require("mongoose");

const SaleInvoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Sale Type
    saleType: {
      type: String,
      enum: ["single", "bulk", "generic"],
      required: true,
    },

    // Invoice Number
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Sale Date
    saleDate: {
      type: Date,
      default: Date.now,
    },

    // Customer Information
    customerName: {
      type: String,
    },
    customerNumber: {
      type: String,
    },
    cnicFrontPic: {
      type: String,
    },
    cnicBackPic: {
      type: String,
    },

    // Phone Details
    phoneDetails: {
      // IMEI Information
      imei1: {
        type: mongoose.Schema.Types.Mixed, // Can be string or array
      },
      imei2: {
        type: mongoose.Schema.Types.Mixed, // Can be string or array
      },

      // Phone Specifications
      companyName: {
        type: String,
      },
      modelName: {
        type: String,
      },
      color: {
        type: String,
      },
      ramMemory: {
        type: String,
      },
      batteryHealth: {
        type: String,
      },
      simOption: {
        type: String,
      },
      specifications: {
        type: String,
      },
      phoneCondition: {
        type: String,
      },

      // Warranty
      warranty: {
        type: String,
      },
    },

    // Pricing Information
    pricing: {
      salePrice: {
        type: Number,
      },
      purchasePrice: {
        type: Number,
      },
      totalInvoice: {
        type: Number,
      },
      profit: {
        type: Number,
      },
      demandPrice: {
        type: Number,
      },
      finalPrice: {
        type: Number,
      },
    },

    // Payment Information
    payment: {
      sellingPaymentType: {
        type: String,
        enum: ["Full Payment", "Credit", "Bank", "Exchange", "Cash"],
      },

      // Bank Payment Details
      bankAccountUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddBankAccount",
      },
      accountCash: {
        type: Number,
      },
      bankName: {
        type: String,
      },

      // Pocket Cash Details
      pocketCash: {
        type: Number,
      },

      // Credit Payment Details
      payableAmountNow: {
        type: Number,
      },
      payableAmountLater: {
        type: Number,
      },
      payableAmountLaterDate: {
        type: Date,
      },

      // Exchange Details
      exchangePhoneDetail: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    // Accessories
    accessories: [
      {
        name: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Accessory",
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
        totalPrice: {
          type: Number,
        },
      },
    ],

    // Entity/Person Information
    entityData: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
      },
      name: {
        type: String,
      },
      number: {
        type: String,
      },
    },

    // References to original sale records
    references: {
      purchasePhoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchasePhone",
      },
      bulkPhonePurchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BulkPhonePurchase",
      },
      singleSoldPhoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SingleSoldPhone",
      },
      soldPhoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SoldPhone",
      },
    },

    // Additional metadata
    metadata: {
      shopid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
      notes: {
        type: String,
      },
      imeiPrices: [
        {
          imei: String,
          price: Number,
        },
      ],
    },

    // Return/Refund Information
    isReturned: {
      type: Boolean,
      default: false,
    },
    returnStatus: {
      type: String,
      enum: ["semi-return", "full-return", null],
      default: null,
    },
    returnedAt: {
      type: Date,
    },
    returnReason: {
      type: String,
    },
    returnedImeis: {
      type: [String], // Array of IMEIs that have been returned (for bulk phones)
      default: [],
    },
    returnedAccessories: [
      {
        name: { type: mongoose.Schema.Types.ObjectId, ref: "Accessory" },
        quantity: { type: Number },
      },
    ],
    returnAmount: {
      type: Number, // Partial return amount if not full return
      default: 0,
    },
    returnHistory: [
      {
        returnedAt: { type: Date, default: Date.now },
        returnReason: { type: String },
        returnStatus: { type: String },
        returnAmount: { type: Number },
        returnedImeis: [String],
        returnedAccessories: [
          {
            name: { type: mongoose.Schema.Types.ObjectId, ref: "Accessory" },
            quantity: { type: Number },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SaleInvoiceSchema.index({ userId: 1, saleDate: -1 });
SaleInvoiceSchema.index({ invoiceNumber: 1 });
SaleInvoiceSchema.index({ "entityData._id": 1 });
SaleInvoiceSchema.index({ "references.purchasePhoneId": 1 });
SaleInvoiceSchema.index({ "references.bulkPhonePurchaseId": 1 });

module.exports = mongoose.model("SaleInvoice", SaleInvoiceSchema);
