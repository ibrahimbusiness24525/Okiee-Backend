const { Company, Model } = require("../schema/CompanySchema");

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists." });
    }

    const company = await Company.create({ name });
    res.status(201).json({ message: "Company created successfully", company });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Create a new model for a specific company
exports.createModel = async (req, res) => {
  try {
    const { name, companyId } = req.body;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const model = await Model.create({ name, companyId });

    // Update the company’s modelName field with this new model
    company.modelName = model._id;
    await company.save();

    res.status(201).json({ message: "Model created successfully", model });
  } catch (error) {
    console.error("Error creating model:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
exports.getModelsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Get all models for this company
    const models = await Model.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ models });
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
