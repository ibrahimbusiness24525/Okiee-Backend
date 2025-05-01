const { AddBankAccount, BankTransaction } = require("../schema/BankAccountSchema"); // adjust the path if needed

// Create a new bank account
exports.createBank = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bankName, accountType } = req.body;

        const newBank = await AddBankAccount.create({ userId, bankName, accountType });

        res.status(201).json({ success: true, bank: newBank });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Add amount to bank account
exports.addAmountToBank = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bankId, sourceOfAmountAddition, accountCash } = req.body;

        // Find the bank account
        const bank = await AddBankAccount.findById(bankId);
        if (!bank) return res.status(404).json({ success: false, message: "Bank account not found" });

        // Create the transaction
        const transaction = await BankTransaction.create({
            bankId,
            userId,
            sourceOfAmountAddition,
            accountCash,
            cashIn: accountCash, // Assuming cashIn is the amount added
        });

        // Update the bank account's accountCash
        let newAccountCash = bank.accountCash;

        // Adjust accountCash based on the source of the transaction
        // if (sourceOfAmount === "deposit") {
            newAccountCash += Number(accountCash);
            // Add the amount if it's a deposit
        // } else if (sourceOfAmount === "withdrawal") {
        //     newAccountCash -= accountCash; 
        // }

        // Update the AddBankAccount with the new accountCash value
        await AddBankAccount.findByIdAndUpdate(
            bankId,
            { 
            $inc: { cashIn: accountCash, accountCash: accountCash } // Increment both cashIn and accountCash
            },
            { new: true } // Return the updated document
        );

        // Send response with success and the updated transaction
        res.status(201).json({
            success: true,
            transaction,
            updatedBankAccount: { bankId, accountCash: newAccountCash, },
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Deduct cash from bank account
exports.deductCashFromBank = async (req, res) => {
    
    try {
        const userId = req.user.id;
        const { bankId, sourceOfAmountDeduction, accountCash } = req.body;

        // Find the bank account
        const bank = await AddBankAccount.findById(bankId);
        if (!bank) return res.status(404).json({ success: false, message: "Bank account not found" });

        // Ensure that the accountCash is a negative value for a withdrawal
        const negativeAccountCash = -Math.abs(accountCash);

        // Create the transaction for deduction
        const transaction = await BankTransaction.create({
            bankId,
            userId,
            cashOut: accountCash, // Assuming cashOut is the amount deducted
            sourceOfAmountDeduction,
            accountCash: negativeAccountCash, // Use negative value for withdrawal
        });

        // Update the bank account's accountCash by deducting the amount
        const newAccountCash = bank.accountCash + negativeAccountCash;

        // Update the AddBankAccount with the new accountCash value
        await AddBankAccount.findByIdAndUpdate(
            bankId,
            {
                $inc: { cashOut: accountCash, accountCash: negativeAccountCash } // Increment cashOut and decrement accountCash
            },
            {
                $inc:{cashIn: -accountCash, accountCash: negativeAccountCash} // Increment cashIn and decrement accountCash
            },
            { accountCash: newAccountCash },
            { new: true } 
        );

        // Send response with success and the updated transaction and bank account details
        res.status(201).json({
            success: true,
            transaction,
            updatedBankAccount: { bankId, accountCash: newAccountCash },
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Delete a bank account
exports.deleteBank = async (req, res) => {
    try {
        const { bankId } = req.params;
        const userId = req.user.id;

        const bank = await AddBankAccount.findOneAndDelete({ _id: bankId, userId });
        if (!bank) return res.status(404).json({ success: false, message: "Bank account not found or not authorized" });

        res.status(200).json({ success: true, message: "Bank account deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Edit a bank account
exports.editBank = async (req, res) => {
    try {
        const { bankId } = req.params;
        const userId = req.user.id;
        const { bankName, accountType } = req.body;

        const bank = await AddBankAccount.findOneAndUpdate(
            { _id: bankId, userId },
            { bankName, accountType },
            { new: true }
        );

        if (!bank) return res.status(404).json({ success: false, message: "Bank account not found or not authorized" });

        res.status(200).json({ success: true, bank });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllBanksController = async (req, res) => {
    try {
        const userId = req.user.id;

        const banks = await AddBankAccount.find({ userId });

        res.status(200).json({ success: true, banks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};