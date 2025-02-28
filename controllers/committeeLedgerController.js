const { Committee, Member } = require("../schema/CommitteeLedger");

// Create Committee
exports.createCommittee = async (req, res) => {
    try {
        const userId = req.user.id;
        const {  committeeName, totalAmount, numberOfMembers, headName } = req.body;

        const newCommittee = new Committee({
            userId,
            committeeName,
            totalAmount,
            numberOfMembers,
            headName 
        });

        await newCommittee.save();
        res.status(201).json({ message: "Committee created successfully", committee: newCommittee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Committees for a User
exports.getUserCommittees = async (req, res) => {
    try {
        const userId = req.user.id;
        const committees = await Committee.find({ userId });
        res.json(committees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add Member to Committee
exports.addMember = async (req, res) => {
    try {
        const userId = req.user.id;
        const { committeeId } = req.body;

        const newMember = new Member({
            committeeId,
            userId,
            paymentHistory: []
        });

        await newMember.save();
        res.status(201).json({ message: "Member added successfully", member: newMember });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mark Payment as Paid
exports.markPayment = async (req, res) => {
    try {
        const { memberId } = req.params;
        const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ message: "Member not found" });

        const existingPayment = member.paymentHistory.find(p => p.month === month);
        if (existingPayment) {
            existingPayment.status = true;
        } else {
            member.paymentHistory.push({ month, status: true });
        }

        await member.save();
        res.json({ message: "Payment updated successfully", member });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
