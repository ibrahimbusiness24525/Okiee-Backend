const express = require("express");
const router = express.Router();
const companyController = require("../controllers/CompanyController");

router.post("/create-company", companyController.createCompany);
router.post("/create-model", companyController.createModel);
router.get("/all-companies", companyController.getAllCompanies);
router.get("/models/:companyId", companyController.getModelsByCompany);


module.exports = router;
