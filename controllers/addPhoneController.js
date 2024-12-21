const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const AddPhoneSchema = require("../schema/AddMobilePhoneSchema");
const multer = require('multer');

// Set up Multer to store images locally or in memory (for Base64 or direct database storage)
const storage = multer.memoryStorage(); // For memory storage
const upload = multer({ storage: storage });

// API route to handle phone addition
exports.addPhone = async (req, res) => {
  // Use multer to handle image uploads
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Image upload failed', error: err.message });
    }

    // Log the uploaded files to debug
    console.log(req.files); // Add this line to ensure files are uploaded

    const { companyName, modelSpecifications, imei, demandPrice, imei2, finalPrice, shopid, color } = req.body;

    try {
      // Handle validation (Optional)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Optional: Check for unique IMEI numbers
      const existingPhone = await AddPhoneSchema.findOne({ $or: [{ imei }, { imei: imei2 }] });
      if (existingPhone) {
        return res.status(400).json({
          message: "A phone with one of the provided IMEI numbers already exists.",
        });
      }

      // Prepare images (if any) - Convert to Base64
      const images = req.files ? req.files.map((file) => file.buffer.toString('base64')) : []; // Convert to Base64 if needed

      // Create a new phone entry
      const phone = new AddPhoneSchema({
        images,
        companyName,
        modelSpecifications,
        imei,
        demandPrice,
        imei2,
        finalPrice,
        shopId: shopid,
        color,
      });

      // Save the phone entry
      const savedPhone = await phone.save();

      return res.status(201).json({
        message: "Phone added successfully!",
        phone: savedPhone,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error, please try again",
        error: error.message,
      });
    }
  });
};

exports.updatePhone = async (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: 'Image upload failed', error: err.message });
        }
    const { id } = req.params;
    const { images, companyName, modelSpecifications, imei, demandPrice, imei2, finalPrice,color } = req.body;

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const images = req.files ? req.files.map((file) => file.buffer.toString('base64')) : [];         

        const updatedPhone = await AddPhoneSchema.findByIdAndUpdate(
            id,
            {
                images,
                companyName,
                modelSpecifications,
                imei,
                demandPrice,
                imei2: imei2 || '',
                finalPrice,
                color
            },
            { new: true }
        );

        if (!updatedPhone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        return res.status(200).json({
            message: "Phone updated successfully!",
            phone: updatedPhone,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
})
};

exports.deletePhone = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPhone = await AddPhoneSchema.findByIdAndDelete(id);

        if (!deletedPhone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        return res.status(200).json({
            message: "Phone deleted successfully!",
            phone: deletedPhone,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

exports.getPhone = async (req, res) => {
    const { id } = req.params;

    try {
        const phone = await AddPhoneSchema.findById(id);

        if (!phone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        return res.status(200).json({
            message: "Phone retrieved successfully!",
            phone: phone,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};


exports.getAllPhones = async (req, res) => {
    const id = req.params.id
    try {
      const phones = await AddPhoneSchema.find({shopId:id});
      return res.status(200).json({
        message: "Phones retrieved successfully!",
        phones: phones,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error, please try again",
        error: error.message,
      });
    }
  };