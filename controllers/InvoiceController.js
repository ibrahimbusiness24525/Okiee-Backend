const { validationResult } = require("express-validator");
const InvoiceSchema = require("../schema/InvoiceItemSchema");
const AddPhoneSchema = require("../schema/AddMobilePhoneSchema");
const mongoose = require("mongoose");

exports.createInvoice = async (req, res) => {
    const { shopId, invoiceNumber, invoiceDate, items, totalAmount } = req.body;

    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const deletedItems = [];

        try {
            // Delete phones from AddPhoneSchema corresponding to the items
            for (const item of items) {
                if (item.mobileId) {
                    const deletedItem = await AddPhoneSchema.findByIdAndDelete(item.mobileId);
                    if (!deletedItem) {
                        // Rollback previously deleted items
                        for (const rollbackItem of deletedItems) {
                            await AddPhoneSchema.create(rollbackItem);
                        }
                        return res.status(400).json({
                            message: "Failed to delete mobile item, please try again."
                        });
                    }
                    deletedItems.push(deletedItem); // Store successfully deleted items for rollback if needed
                }
            }

            // Create a new invoice instance
            const convertedShopId = mongoose.Types.ObjectId(shopId);
            const invoice = new InvoiceSchema({
                shopId:convertedShopId,
                invoiceNumber,
                invoiceDate,
                items,
                totalAmount,
            });

            // Save the invoice to the database
            const savedInvoice = await invoice.save();

            return res.status(201).json({
                message: "Invoice created successfully!",
                invoice: savedInvoice,
            });
        } catch (error) {
            // Rollback previously deleted items if invoice creation fails
            for (const rollbackItem of deletedItems) {
                await AddPhoneSchema.create(rollbackItem);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error creating invoice:", error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};



// Delete Invoice
exports.deleteInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the invoice
        const deletedInvoice = await InvoiceSchema.findByIdAndDelete(id);

        if (!deletedInvoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        return res.status(200).json({
            message: "Invoice deleted successfully!",
            invoice: deletedInvoice,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

// Get a Single Invoice by ID
exports.getInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the invoice by ID
        const invoice = await InvoiceSchema.findById(id).populate('items.invoiceId');

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        return res.status(200).json({
            message: "Invoice retrieved successfully!",
            invoice: invoice,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

// Get All Invoices
exports.getAllInvoices = async (req, res) => {
    const { id } = req.params;
    try {
        const invoices = await InvoiceSchema.find({shopId:id});
        return res.status(200).json({
            message: "Invoices retrieved successfully!",
            invoices: invoices,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};
