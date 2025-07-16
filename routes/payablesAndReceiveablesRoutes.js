// routes/creditRoutes.js
const express = require("express");
const router = express.Router();
const creditController = require("../controllers/payablesAndReceiveablesController");
const { decoderMiddleware } = require("../services/authServices");


// Apply authentication middleware to all routes


// 1. Create a new person
router.post("/create",decoderMiddleware, creditController.createPerson);

// 2. Give credit to a person
router.post("/give-credit",decoderMiddleware,  creditController.giveCredit);

// 3. Take credit from a person
router.post("/take-credit",decoderMiddleware,  creditController.takeCredit);

// 4. Get all persons with their credit info
router.get("/all",decoderMiddleware,  creditController.getAllPersons);

router.get("/nameAndId",decoderMiddleware,  creditController.getAllPersonsNameAndId);
// 5. Get detailed info of a specific person by ID
router.get("/:id",decoderMiddleware,  creditController.getPersonDetail);


module.exports = router;
