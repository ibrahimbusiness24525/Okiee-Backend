const express = require("express");
const router = express.Router();
const controllers = require("../controllers/committeeLedgerController");

// Committee Routes
router.post("/committee", controllers.createCommittee);
router.get("/user/committees/:userId", controllers.getUserCommittees);

// Member Routes
router.post("/member", controllers.addMember);
router.put("/member/pay/:memberId", controllers.markPayment);

module.exports = router;
