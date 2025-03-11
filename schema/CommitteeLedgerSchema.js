const mongoose = require("mongoose");

// Committee Schema
const CommitteeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    committeeName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    myComitteeNameNumber:{
        type: Number,
        required: true
    },
    numberOfMembers: {
        type: Number,
        required: true
    },
    headName: {
        type: String,
        required: true 
    },
    status:{
        type:String,
        enum:["Not Paid","Paid","Partially Paid"],
        default:"Not Paid",
    }
},{ timestamps: true });

const MemberSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Committee",
        required: true
    },
    member:{
        type:String,
        required:true
    }
});
const CommitteeRecordSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Committee",
        required: true
    },
    monthNumber:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        required: true,
    },
    amountPaid:{
        type:Number,
        required:true
    }
})
// Export models
const Committee = mongoose.model("Committee", CommitteeSchema);
const CommitteeRecord = mongoose.model("ComitteeRecord",CommitteeRecordSchema)
const Member = mongoose.model("Member", MemberSchema);

module.exports = { Committee, Member,CommitteeRecord };
