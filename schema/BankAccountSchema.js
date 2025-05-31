const { default: mongoose } = require("mongoose");

const AddBankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    cashIn: {
        type: Number,
        required: false
    },
    cashOut: {
        type: Number,
        required: false
    },
    accountCash: {
        type: Number,
        default: 0,
        required: false
    },
    accountType: {
        type: String,
        required: true
    },
    accountNumber: {
        type: Number,
        required: false,
    }
}, { timestamps: true });

const BankTransactionSchema = new mongoose.Schema({
    bankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AddBankAccount',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cashIn: {
        type: Number,
        required: false
    },
    cashOut: {
        type: Number,
        required: false
    },
    sourceOfAmountAddition: {
        type: String,
        required: false
    },
    reasonOfAmountDeduction: {
        type: String,
        required: false
    },
    accountCash: {
        type: Number,
        required: true
    },
    accountType: {
        type: String,
        required: false
    },
}, { timestamps: true });


const AddBankAccount = mongoose.model("AddBankAccount", AddBankAccountSchema);
const BankTransaction = mongoose.model("BankTransaction", BankTransactionSchema);
module.exports = { AddBankAccount, BankTransaction };
