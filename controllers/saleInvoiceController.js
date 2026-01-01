const SaleInvoice = require("../schema/SaleInvoiceSchema");
const {
  PurchasePhone,
  SingleSoldPhone,
  SoldPhone,
  BulkPhonePurchase,
  Imei,
} = require("../schema/purchasePhoneSchema");
const {
  Accessory,
  AccessoryTransaction,
} = require("../schema/accessorySchema");
const {
  AddBankAccount,
  BankTransaction,
} = require("../schema/BankAccountSchema");
const {
  Person,
  CreditTransaction,
} = require("../schema/PayablesAndReceiveablesSchema");
const {
  PocketCashSchema,
  PocketCashTransactionSchema,
} = require("../schema/PocketCashSchema");

// Helper function to generate invoice number
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create invoice from sale data
exports.createSaleInvoice = async (invoiceData) => {
  try {
    // Debug log for tracking raw incoming invoice payload
    console.log("🧾 [SaleInvoice] createSaleInvoice called with data:", {
      userId: invoiceData?.userId,
      saleType: invoiceData?.saleType,
      invoiceNumber: invoiceData?.invoiceNumber,
      saleDate: invoiceData?.saleDate,
      customerNumber: invoiceData?.customerNumber,
      totalInvoice: invoiceData?.pricing?.totalInvoice,
    });

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = generateInvoiceNumber();
    }

    const invoice = new SaleInvoice(invoiceData);
    await invoice.save();

    // Success log after invoice is persisted
    console.log("✅ [SaleInvoice] Invoice created successfully:", {
      id: invoice?._id?.toString?.(),
      invoiceNumber: invoice?.invoiceNumber,
      userId: invoice?.userId,
      saleType: invoice?.saleType,
      saleDate: invoice?.saleDate,
      totalInvoice: invoice?.pricing?.totalInvoice,
    });

    return invoice;
  } catch (error) {
    console.error("Error creating sale invoice:", error);
    throw error;
  }
};

// Get all invoices for a user
exports.getAllInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      saleType,
      startDate,
      endDate,
      customerNumber,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter
    const filter = { userId };

    if (saleType) {
      filter.saleType = saleType;
    }

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    if (customerNumber) {
      filter.customerNumber = customerNumber;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch invoices with pagination
    const invoices = await SaleInvoice.find(filter)
      .populate("payment.bankAccountUsed")
      .populate("entityData._id")
      .populate("references.purchasePhoneId")
      .populate("references.bulkPhonePurchaseId")
      .populate("references.singleSoldPhoneId")
      .populate("references.soldPhoneId")
      .populate("accessories.name")
      .populate("metadata.shopid")
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await SaleInvoice.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await SaleInvoice.findOne({ _id: id, userId })
      .populate("payment.bankAccountUsed")
      .populate("entityData._id")
      .populate("references.purchasePhoneId")
      .populate("references.bulkPhonePurchaseId")
      .populate("references.singleSoldPhoneId")
      .populate("references.soldPhoneId")
      .populate("accessories.name")
      .populate("metadata.shopid")
      .lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice by invoice number
exports.getInvoiceByNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.user.id;

    const invoice = await SaleInvoice.findOne({ invoiceNumber, userId })
      .populate("payment.bankAccountUsed")
      .populate("entityData._id")
      .populate("references.purchasePhoneId")
      .populate("references.bulkPhonePurchaseId")
      .populate("references.singleSoldPhoneId")
      .populate("references.soldPhoneId")
      .populate("accessories.name")
      .populate("metadata.shopid")
      .lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await SaleInvoice.findOneAndDelete({ _id: id, userId });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Return/Refund invoice
exports.returnInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { returnReason } = req.body; // Optional return reason

    // Find the invoice
    const invoice = await SaleInvoice.findOne({ _id: id, userId })
      .populate("payment.bankAccountUsed")
      .populate("entityData._id")
      .populate("references.singleSoldPhoneId")
      .populate("references.soldPhoneId")
      .populate("references.purchasePhoneId")
      .populate("references.bulkPhonePurchaseId")
      .populate("accessories.name");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check if invoice is already returned (if you add a status field)
    if (invoice.isReturned) {
      return res.status(400).json({
        success: false,
        message: "Invoice has already been returned",
      });
    }

    const totalRefundAmount = invoice.pricing?.totalInvoice || 0;

    // 1. Restore phone stock based on sale type
    if (
      invoice.saleType === "single" &&
      invoice.references?.singleSoldPhoneId
    ) {
      const singleSoldPhone = invoice.references.singleSoldPhoneId;

      // Restore purchase phone status
      if (invoice.references?.purchasePhoneId) {
        const purchasePhone = await PurchasePhone.findById(
          invoice.references.purchasePhoneId
        );
        if (purchasePhone) {
          purchasePhone.status = "Available";
          purchasePhone.isSold = false;
          purchasePhone.soldDetails = undefined;
          await purchasePhone.save();
        }
      }

      // Delete or mark single sold phone as returned
      await SingleSoldPhone.findByIdAndDelete(singleSoldPhone._id);
    } else if (invoice.saleType === "bulk" && invoice.references?.soldPhoneId) {
      const soldPhone = invoice.references.soldPhoneId;

      // Restore IMEIs in bulk purchase
      if (invoice.references?.bulkPhonePurchaseId) {
        const bulkPurchase = await BulkPhonePurchase.findById(
          invoice.references.bulkPhonePurchaseId
        ).populate("ramSimDetails");

        if (bulkPurchase && soldPhone.imei1) {
          const imeiList = Array.isArray(soldPhone.imei1)
            ? soldPhone.imei1
            : [soldPhone.imei1];

          // Find and restore IMEIs
          for (const imeiValue of imeiList) {
            const imeiRecord = await Imei.findOne({
              imei1: imeiValue,
              status: "Sold",
            });

            if (imeiRecord) {
              imeiRecord.status = "Available";
              await imeiRecord.save();
            }
          }

          // Update bulk purchase status
          const availableImeis = await Imei.countDocuments({
            ramSimId: { $in: bulkPurchase.ramSimDetails.map((r) => r._id) },
            status: "Available",
          });

          if (availableImeis > 0) {
            bulkPurchase.status =
              availableImeis <
              bulkPurchase.ramSimDetails.reduce(
                (sum, r) => sum + (r.imeiNumbers?.length || 0),
                0
              )
                ? "Partially Sold"
                : "Available";
            await bulkPurchase.save();
          }
        }
      }

      // Delete or mark sold phone as returned
      await SoldPhone.findByIdAndDelete(soldPhone._id);
    }

    // 2. Restore accessory stock
    if (invoice.accessories && invoice.accessories.length > 0) {
      for (const accItem of invoice.accessories) {
        if (accItem.name && accItem.quantity) {
          const accessory = await Accessory.findById(accItem.name);
          if (accessory) {
            accessory.stock += Number(accItem.quantity);
            accessory.totalPrice +=
              Number(accessory.perPiecePrice) * Number(accItem.quantity);

            // Calculate and subtract profit
            const itemProfit =
              (Number(accItem.price) - Number(accessory.perPiecePrice)) *
              Number(accItem.quantity);
            accessory.profit = Math.max(0, accessory.profit - itemProfit);

            await accessory.save();
          }
        }
      }
    }

    // 3. Refund payments
    const payment = invoice.payment || {};
    const refundAmount = totalRefundAmount;

    // Refund bank payment
    if (payment.bankAccountUsed && payment.accountCash) {
      const bank = await AddBankAccount.findById(payment.bankAccountUsed);
      if (bank) {
        const refundAmountBank = Number(payment.accountCash || 0);
        bank.accountCash -= refundAmountBank; // Deduct from bank (refund to customer)
        await bank.save();

        await BankTransaction.create({
          bankId: bank._id,
          userId,
          reasonOfAmountDeduction: `Invoice return: ${
            invoice.invoiceNumber
          } - ${returnReason || "Customer return"}`,
          amount: refundAmountBank,
          accountCash: bank.accountCash,
          accountType: bank.accountType,
        });
      }
    }

    // Refund pocket cash
    if (payment.pocketCash) {
      const pocket = await PocketCashSchema.findOne({ userId });
      if (pocket) {
        const refundAmountPocket = Number(payment.pocketCash || 0);
        pocket.accountCash -= refundAmountPocket; // Deduct from pocket (refund to customer)
        await pocket.save();

        await PocketCashTransactionSchema.create({
          userId,
          pocketCashId: pocket._id,
          amountDeducted: refundAmountPocket,
          accountCash: pocket.accountCash,
          remainingAmount: pocket.accountCash,
          reasonOfAmountDeduction: `Invoice return: ${
            invoice.invoiceNumber
          } - ${returnReason || "Customer return"}`,
        });
      }
    }

    // 4. Adjust credit transactions if applicable
    if (
      payment.sellingPaymentType === "Credit" &&
      payment.payableAmountLater &&
      invoice.entityData?._id
    ) {
      const person = await Person.findById(invoice.entityData._id);
      if (person) {
        const creditAmount = Number(payment.payableAmountLater || 0);

        // Adjust credit - reduce givingCredit (customer owes us less)
        if (person.givingCredit > 0) {
          person.givingCredit = Math.max(0, person.givingCredit - creditAmount);
        }

        // Update status
        if (person.givingCredit === 0 && person.takingCredit === 0) {
          person.status = "Settled";
        } else if (person.givingCredit === 0) {
          person.status = "Payable";
        }

        await person.save();

        await CreditTransaction.create({
          userId,
          personId: person._id,
          givingCredit: -creditAmount,
          balanceAmount: person.givingCredit,
          description: `Invoice return: ${
            invoice.invoiceNumber
          } - Credit adjustment: ${creditAmount} - ${
            returnReason || "Customer return"
          }`,
        });
      }
    }

    // 5. Mark invoice as returned
    invoice.isReturned = true;
    invoice.returnedAt = new Date();
    invoice.returnReason = returnReason || "Customer return";
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Invoice returned successfully",
      data: {
        invoice,
        refundAmount,
        returnedAt: invoice.returnedAt,
      },
    });
  } catch (error) {
    console.error("Error returning invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get detailed phone information by invoice number
exports.getPhoneDetailsByInvoiceNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.user.id;

    // Find the invoice by invoice number
    const invoice = await SaleInvoice.findOne({ invoiceNumber, userId })
      .populate("payment.bankAccountUsed")
      .populate("entityData._id")
      .populate("references.purchasePhoneId")
      .populate("references.bulkPhonePurchaseId")
      .populate("references.singleSoldPhoneId")
      .populate("references.soldPhoneId")
      .populate("accessories.name")
      .populate("metadata.shopid");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    let phoneDetails = null;

    // Handle different sale types
    if (
      invoice.saleType === "single" &&
      invoice.references?.singleSoldPhoneId
    ) {
      // Single phone sale
      const singleSoldPhone = invoice.references.singleSoldPhoneId;
      const purchasePhone = invoice.references.purchasePhoneId;

      phoneDetails = {
        saleType: "single",
        phoneInfo: {
          companyName:
            singleSoldPhone.companyName || purchasePhone?.companyName,
          modelName: singleSoldPhone.modelName || purchasePhone?.modelName,
          color: singleSoldPhone.color || purchasePhone?.color,
          ramMemory: singleSoldPhone.ramMemory || purchasePhone?.ramMemory,
          batteryHealth:
            singleSoldPhone.batteryHealth || purchasePhone?.batteryHealth,
          specifications:
            singleSoldPhone.specifications || purchasePhone?.specifications,
          phoneCondition:
            singleSoldPhone.phoneCondition || purchasePhone?.phoneCondition,
          warranty: singleSoldPhone.warranty || purchasePhone?.warranty,
          imei1: singleSoldPhone.imei1 || purchasePhone?.imei1,
          imei2: singleSoldPhone.imei2 || purchasePhone?.imei2,
          phonePicture:
            singleSoldPhone.phonePicture || purchasePhone?.phonePicture,
          personPicture:
            singleSoldPhone.personPicture || purchasePhone?.personPicture,
        },
        saleInfo: {
          saleDate: singleSoldPhone.dateSold || invoice.saleDate,
          salePrice: singleSoldPhone.salePrice,
          totalInvoice: singleSoldPhone.totalInvoice,
          profit: singleSoldPhone.profit,
          customerName: singleSoldPhone.customerName || invoice.customerName,
          customerNumber:
            singleSoldPhone.customerNumber || invoice.customerNumber,
          cnicFrontPic: singleSoldPhone.cnicFrontPic,
          cnicBackPic: singleSoldPhone.cnicBackPic,
        },
        purchaseInfo: purchasePhone
          ? {
              purchaseDate: purchasePhone.date,
              purchasePrice: purchasePhone.price?.purchasePrice,
              finalPrice: purchasePhone.price?.finalPrice,
              demandPrice: purchasePhone.price?.demandPrice,
              fatherName: purchasePhone.fatherName,
              cnic: purchasePhone.cnic,
              mobileNumber: purchasePhone.mobileNumber,
              isApprovedFromEgadgets: purchasePhone.isApprovedFromEgadgets,
              eGadgetStatusPicture: purchasePhone.eGadgetStatusPicture,
            }
          : null,
        payment: invoice.payment,
        accessories: invoice.accessories,
        entityData: invoice.entityData,
        references: invoice.references,
      };
    } else if (invoice.saleType === "bulk" && invoice.references?.soldPhoneId) {
      // Bulk phone sale
      const soldPhone = invoice.references.soldPhoneId;
      const bulkPurchase = invoice.references.bulkPhonePurchaseId;

      // Get IMEI details
      let imeiDetails = [];
      if (soldPhone.imei1 && Array.isArray(soldPhone.imei1)) {
        // Multiple IMEIs in this bulk sale
        for (const imei of soldPhone.imei1) {
          // Find the corresponding IMEI record to get full details
          const imeiRecord = await Imei.findOne({
            imei1: imei,
            status: { $in: ["Sold", "Available"] },
          }).populate({
            path: "ramSimId",
            populate: {
              path: "imeiNumbers",
            },
          });

          if (imeiRecord && imeiRecord.ramSimId) {
            imeiDetails.push({
              imei1: imei,
              imei2: soldPhone.imei2?.[soldPhone.imei1.indexOf(imei)] || null,
              ramSimId: imeiRecord.ramSimId._id,
              ramMemory: imeiRecord.ramSimId.ramMemory,
              color: imeiRecord.ramSimId.color,
              batteryHealth: imeiRecord.ramSimId.batteryHealth,
              specifications: imeiRecord.ramSimId.specifications,
              priceOfOne: imeiRecord.ramSimId.priceOfOne,
            });
          }
        }
      }

      phoneDetails = {
        saleType: "bulk",
        phoneInfo: {
          companyName: bulkPurchase?.companyName || soldPhone.companyName,
          modelName: bulkPurchase?.modelName || soldPhone.modelName,
          phoneCondition:
            soldPhone.phoneCondition || bulkPurchase?.phoneCondition,
          warranty: soldPhone.warranty,
          imeiDetails: imeiDetails,
          phonePicture: bulkPurchase?.phonePicture,
          personPicture: bulkPurchase?.personPicture,
        },
        saleInfo: {
          saleDate: soldPhone.dateSold || invoice.saleDate,
          salePrice: soldPhone.salePrice,
          totalInvoice: soldPhone.totalInvoice,
          profit: soldPhone.profit,
          customerName: soldPhone.customerName || invoice.customerName,
          customerNumber: soldPhone.customerNumber || invoice.customerNumber,
          cnicFrontPic: soldPhone.cnicFrontPic,
          cnicBackPic: soldPhone.cnicBackPic,
          quantity: soldPhone.imei1?.length || 1,
        },
        purchaseInfo: bulkPurchase
          ? {
              purchaseDate: bulkPurchase.date,
              totalPurchasePrice: bulkPurchase.prices?.buyingPrice,
              totalQuantity:
                bulkPurchase.ramSimDetails?.reduce(
                  (sum, ramSim) => sum + (ramSim.imeiNumbers?.length || 0),
                  0
                ) || 0,
              ramSimDetails: bulkPurchase.ramSimDetails,
              fatherName: bulkPurchase.fatherName,
              cnic: bulkPurchase.cnic,
              mobileNumber: bulkPurchase.mobileNumber,
              isApprovedFromEgadgets: bulkPurchase.isApprovedFromEgadgets,
              eGadgetStatusPicture: bulkPurchase.eGadgetStatusPicture,
            }
          : null,
        payment: invoice.payment,
        accessories: invoice.accessories,
        entityData: invoice.entityData,
        references: invoice.references,
      };
    } else if (invoice.saleType === "generic") {
      // Generic sale - use invoice data directly
      phoneDetails = {
        saleType: "generic",
        phoneInfo: invoice.phoneDetails || {},
        saleInfo: {
          saleDate: invoice.saleDate,
          customerName: invoice.customerName,
          customerNumber: invoice.customerNumber,
          cnicFrontPic: invoice.cnicFrontPic,
          cnicBackPic: invoice.cnicBackPic,
        },
        purchaseInfo: null, // No purchase info for generic sales
        payment: invoice.payment,
        accessories: invoice.accessories,
        entityData: invoice.entityData,
        references: invoice.references,
        pricing: invoice.pricing,
      };
    }

    res.status(200).json({
      success: true,
      message: "Phone details retrieved successfully",
      data: {
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          saleType: invoice.saleType,
          saleDate: invoice.saleDate,
          isReturned: invoice.isReturned,
          returnedAt: invoice.returnedAt,
          returnReason: invoice.returnReason,
        },
        phoneDetails: phoneDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching phone details by invoice:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get invoice statistics
exports.getInvoiceStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const filter = { userId };
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const invoices = await SaleInvoice.find(filter).lean();

    const statistics = {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce(
        (sum, inv) => sum + (inv.pricing?.totalInvoice || 0),
        0
      ),
      totalProfit: invoices.reduce(
        (sum, inv) => sum + (inv.pricing?.profit || 0),
        0
      ),
      totalCost: invoices.reduce(
        (sum, inv) => sum + (inv.pricing?.purchasePrice || 0),
        0
      ),
      bySaleType: {
        single: invoices.filter((inv) => inv.saleType === "single").length,
        bulk: invoices.filter((inv) => inv.saleType === "bulk").length,
        generic: invoices.filter((inv) => inv.saleType === "generic").length,
      },
      byPaymentType: {},
    };

    // Calculate payment type statistics
    invoices.forEach((inv) => {
      const paymentType = inv.payment?.sellingPaymentType || "Unknown";
      statistics.byPaymentType[paymentType] =
        (statistics.byPaymentType[paymentType] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
