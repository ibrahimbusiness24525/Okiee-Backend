const {PocketCashTransaction} = require('../schema/PocketCashSchema');
const mongoose = require('mongoose');

// Add Cash
exports.addCash = async (req, res) => {
  try {
    const { amount, sourceOfAmountAddition } = req.body;
    const userId = req.user.id;
    console.log("userID",userId,"amount",amount)
    
    if (!amount || amount <= 0) {
        
        return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    
    const transactionData = {
        accountCash: amount,
        userId,
    };
    console.log("transactionData",transactionData)
    
    if (sourceOfAmountAddition) {
        transactionData.sourceOfAmountAddition = sourceOfAmountAddition;
    }
    
    console.log("transactionData",transactionData)
    const transaction = new PocketCashTransaction(transactionData);
    await transaction.save();

    return res.status(201).json({ message: 'Cash added successfully', transaction });
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({ message: 'Server error', error });
}
};

// Deduct Cash
exports.deductCash = async (req, res) => {
    try {
    const { amount, reasonOfAmountDeduction } = req.body;
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    
    const transactionData = {
        accountCash: -amount,
        userId,
    };
    
    if (reasonOfAmountDeduction) {
        transactionData.reasonOfAmountDeduction = reasonOfAmountDeduction;
    }
    
    const transaction = new PocketCashTransaction(transactionData);
    await transaction.save();
    
    return res.status(201).json({ message: 'Cash deducted successfully', transaction });
} catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
}
};

exports.getTotalPocketCash = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'userId is required in query' });
        }
        
        const result = await PocketCashTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$accountCash' },
                },
            },
        ]);

        const total = result.length > 0 ? result[0].total : 0;
        res.status(200).json({ total });
    } catch (error) {
        console.error('Error fetching total pocket cash:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

  