const SaleInvoice = require("../schema/SaleInvoiceSchema");

// Helper function to generate invoice number
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create invoice from sale data
exports.createSaleInvoice = async (invoiceData) => {
  try {
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = generateInvoiceNumber();
    }

    const invoice = new SaleInvoice(invoiceData);
    await invoice.save();
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
