const express = require("express");
const router = express.Router();
const companyController = require("../controllers/CompanyController");
const { decoderMiddleware } = require("../services/authServices");

router.post("/create-company", decoderMiddleware, companyController.createCompany);
router.post("/create-model", decoderMiddleware, companyController.createModel);
router.get("/all-companies", decoderMiddleware, companyController.getAllCompanies);
router.get("/models/:companyId", decoderMiddleware, companyController.getModelsByCompany);


module.exports = router;
