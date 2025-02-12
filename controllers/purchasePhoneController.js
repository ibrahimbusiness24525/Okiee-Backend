const multer = require('multer');
const { Imei, RamSim, BulkPhonePurchase, PurchasePhone,SoldPhone } = require("../schema/purchasePhoneSchema");


exports.addPurchasePhone = async (req, res) => {
    try {
        const {
            name, fatherName, companyName, modelName, date, cnic,
            accessories, phoneCondition, specifications, ramMemory,
            color, imei1, imei2, mobileNumber, isApprovedFromEgadgets,
            purchasePrice, finalPrice, demandPrice,warranty,shopid
        } = req.body;

        const phonePicture = req.files['phonePicture']?.[0]?.path;
        const personPicture = req.files['personPicture']?.[0]?.path;
        const eGadgetStatusPicture = req.files['eGadgetStatusPicture']?.[0]?.path;

        // Create a new entry
        const purchasePhone = new PurchasePhone({
            shopid,
            warranty,
            name,
            fatherName,
            companyName,
            modelName,
            date,
            cnic,
            accessories,
            phoneCondition,
            specifications,
            ramMemory,
            color,
            imei1,
            imei2,
            phonePicture,
            personPicture,
            mobileNumber,
            price: {
                purchasePrice,
                finalPrice,
                demandPrice,
            },
            isApprovedFromEgadgets,
            eGadgetStatusPicture,
        });

        // Save to database
        const savedPhone = await purchasePhone.save();
        res.status(201).json({ message: 'Purchase phone slip created successfully!', data: savedPhone });
    } catch (error) {
        console.error('Error creating purchase phone slip:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all purchase phone slips or filtered results
exports.getPurchasePhoneByFilter =  async (req, res) => {
    try {
        // Extract query parameters for filtering
        const {
            name,
            cnic,
            modelName,
            phoneCondition,
            specifications,
            isApprovedFromEgadgets,
            dateFrom,
            dateTo,
        } = req.query;

        // Build the filter object dynamically
        const filters = {};

        if (name) filters.name = new RegExp(name, 'i'); // Case-insensitive search
        if (cnic) filters.cnic = cnic;
        if (modelName) filters.modelName = new RegExp(modelName, 'i'); // Case-insensitive search
        if (phoneCondition) filters.phoneCondition = phoneCondition;
        if (specifications) filters.specifications = specifications;
        if (isApprovedFromEgadgets) filters.isApprovedFromEgadgets = isApprovedFromEgadgets === 'true'; // Convert to boolean
        if (dateFrom || dateTo) {
            filters.date = {};
            if (dateFrom) filters.date.$gte = new Date(dateFrom); // Greater than or equal to
            if (dateTo) filters.date.$lte = new Date(dateTo); // Less than or equal to
        }

        // Query the database with filters
        const purchasePhones = await PurchasePhone.find(filters);

        // Respond with the results
        res.status(200).json({ message: 'Purchase phone slips retrieved successfully!', data: purchasePhones });
    } catch (error) {
        console.error('Error fetching purchase phone slips:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getAllPurchasePhone = async (req, res) => {
  const shopid = req.params
    try {
        // If no query parameters are provided, this will return all records
        const purchasePhones = await PurchasePhone.find();


        // Respond with the results
        res.status(200).json({ 
            message: 'All purchase phone slips retrieved successfully!', 
            data: purchasePhones
        });
    } catch (error) {
        console.error('Error fetching all purchase phone slips:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};
exports.getAllPurchasePhones = async (req, res) => {
  try {
      // Fetch all single purchase phones
      const purchasePhones = await PurchasePhone.find().populate("soldDetails");
      
      // Fetch all bulk purchased phones with RAM and IMEI details
      const bulkPhones = await BulkPhonePurchase.find()
          .populate({
              path: "ramSimDetails",
              populate: { path: "imeiNumbers" },
          });

      // Calculate total quantity of mobiles from bulk phones
      const bulkPhonesWithQuantity = bulkPhones.map(bulkPhone => {
          const totalQuantity = bulkPhone.ramSimDetails.reduce((sum, ramSim) => {
              return sum + (ramSim.imeiNumbers ? ramSim.imeiNumbers.length : 0);
          }, 0);
          return { ...bulkPhone._doc, totalQuantity };
      });

      // Respond with structured data
      res.status(200).json({ 
          message: "All purchase phone slips retrieved successfully!", 
          data: {
              singlePhones: purchasePhones,
              bulkPhones: bulkPhonesWithQuantity
          }
      });
  } catch (error) {
      console.error("Error fetching all purchase phone slips:", error);
      res.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
      });
  }
};



// Get a specific purchase phone slip by ID
exports.getPurchasePhoneById =  async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the document by ID
        const purchasePhone = await PurchasePhone.findById(id);

        if (!purchasePhone) {
            return res.status(404).json({ message: 'Purchase phone slip not found' });
        }

        res.status(200).json({ message: 'Purchase phone slip retrieved successfully!', data: purchasePhone });
    } catch (error) {
        console.error('Error fetching purchase phone slip by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Edit Purchase Phone Slip
exports.editPurchasePhone = async (req, res) => {
    try {
        const { id } = req.params; // ID of the phone slip to edit
        const {
            name, fatherName, companyName, modelName, date, cnic,
            accessories, phoneCondition, specifications, ramMemory,
            color, imei1, imei2, mobileNumber, isApprovedFromEgadgets,
            purchasePrice, finalPrice, demandPrice,warranty,shopid
        } = req.body;

        // Handle file uploads (if any)
        const phonePicture = req.files?.['phonePicture']?.[0]?.path;
        const personPicture = req.files?.['personPicture']?.[0]?.path;
        const eGadgetStatusPicture = req.files?.['eGadgetStatusPicture']?.[0]?.path;

        // Build the update object dynamically
        const updateData = {
            warranty,
            shopid,
            name,
            fatherName,
            companyName,
            modelName,
            date,
            cnic,
            accessories,
            phoneCondition,
            specifications,
            ramMemory,
            color,
            imei1,
            imei2,
            mobileNumber,
            isApprovedFromEgadgets,
            price: {
                purchasePrice,
                finalPrice,
                demandPrice,
            },
        };

        // Conditionally include the file paths if files are provided
        if (phonePicture) updateData.phonePicture = phonePicture;
        if (personPicture) updateData.personPicture = personPicture;
        if (eGadgetStatusPicture) updateData.eGadgetStatusPicture = eGadgetStatusPicture;

        // Find and update the document by ID
        const updatedPhone = await PurchasePhone.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedPhone) {
            return res.status(404).json({ message: 'Purchase phone slip not found' });
        }

        res.status(200).json({ message: 'Purchase phone slip updated successfully!', data: updatedPhone });
    } catch (error) {
        console.error('Error updating purchase phone slip:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete Purchase Phone Slip
exports.deletePurchasePhone = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the document by ID
        const deletedPhone = await PurchasePhone.findByIdAndDelete(id);

        if (!deletedPhone) {
            return res.status(404).json({ message: 'Purchase phone slip not found' });
        }

        res.status(200).json({ message: 'Purchase phone slip deleted successfully!', data: deletedPhone });
    } catch (error) {
        console.error('Error deleting purchase phone slip:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Add a new Bulk Phone Purchase
// router.post("/bulk-phone-purchase",
// exports.addBulkPhones = async (req, res) => {
//   try {
//     const { partyName, date, companyName, modelName, ramSimDetails, prices } = req.body;

//     const bulkPhonePurchase = new BulkPhonePurchase({
//       partyName,
//       date,
//       companyName,
//       modelName,
//       prices,
//     });

//     const savedBulkPhonePurchase = await bulkPhonePurchase.save();

//     savedBulkPhonePurchase.ramSimDetails = ramSimDetails;

//     await savedBulkPhonePurchase.save();

    // for (const ramSim of ramSimDetails) {
    //   const newRamSim = new RamSim({
    //     ramMemory: ramSim.ramMemory,
    //     simOption: ramSim.simOption,
    //     bulkPhonePurchaseId: savedBulkPhonePurchase._id,
    //   });

    //   const savedRamSim = await newRamSim.save();

    //   for (const imei of ramSim.imeiNumbers) {
    //     const newImei = new Imei({
    //       imei1: imei.imei1,
    //       imei2: imei.imei2,
    //       ramSimId: savedRamSim._id,
    //     });
    //     await newImei.save();
    //     savedRamSim.imeiNumbers.push(newImei._id);
    //   }

    //   await savedRamSim.save();
    //   savedBulkPhonePurchase.ramSimDetails.push(savedRamSim._id);
    // }

//     await savedBulkPhonePurchase.save();

//     res.status(201).json({ message: "Bulk Phone Purchase created successfully", data: savedBulkPhonePurchase });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating Bulk Phone Purchase", error: error.message });
//   }
// };

exports.addBulkPhones = async (req, res) => {
  try {
    console.log("Incoming Request Body:", req.body); // Debugging

    const { partyName, date, companyName, modelName, ramSimDetails, prices } = req.body;

    if (!ramSimDetails || !Array.isArray(ramSimDetails)) {
      return res.status(400).json({
        message: "Invalid data: ramSimDetails must be an array and cannot be empty",
      });
    }

    const bulkPhonePurchase = new BulkPhonePurchase({
      partyName,
      date,
      companyName,
      modelName,
      prices,
      ramSimDetails: [], 
    });

    const savedBulkPhonePurchase = await bulkPhonePurchase.save();

    if (ramSimDetails.length > 0 && typeof ramSimDetails[0] === "string") {
      savedBulkPhonePurchase.ramSimDetails = ramSimDetails;
    } else {
      const ramSimData = await Promise.all(
        ramSimDetails.map(async (ramSim) => {
          const newRamSim = new RamSim({
            ramMemory: ramSim.ramMemory,
            simOption: ramSim.simOption,
            bulkPhonePurchaseId: savedBulkPhonePurchase._id,
          });

          const savedRamSim = await newRamSim.save();

          const imeiNumbers = await Promise.all(
            (ramSim.imeiNumbers || []).map(async (imei) => {
              const newImei = new Imei({
                imei1: imei.imei1,
                imei2: imei.imei2,
                ramSimId: savedRamSim._id,
              });
              return await newImei.save();
            })
          );

          savedRamSim.imeiNumbers = imeiNumbers;
          await savedRamSim.save();

          return savedRamSim;
        })
      );

      savedBulkPhonePurchase.ramSimDetails = ramSimData;
    }

    await savedBulkPhonePurchase.save();

    res.status(201).json({
      message: "Bulk Phone Purchase created successfully",
      data: savedBulkPhonePurchase,
    });
  } catch (error) {
    console.error("Error:", error); // Log error details
    res.status(500).json({ message: "Error creating Bulk Phone Purchase", error: error.message });
  }
};

// Get all Bulk Phone Purchases
// router.get("/bulk-phone-purchase", 
exports.getBulkPhone = async (req, res) => {
  try {
    const bulkPhonePurchases = await BulkPhonePurchase.find()
      .populate({
        path: "ramSimDetails",
        model: "RamSim", 
        populate: {
          path: "imeiNumbers",
          model: "Imei", 
        },
      })
      .lean(); 

    res.status(200).json(bulkPhonePurchases);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error fetching Bulk Phone Purchases", error: error.message });
  }
};


// Get Bulk Phone Purchase by ID
// router.get("/bulk-phone-purchase/:id",
exports.getBulkPhoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const bulkPhonePurchase = await BulkPhonePurchase.findById(id)
      .populate({
        path: "ramSimDetails",
        populate: { path: "imeiNumbers" },
      });
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk Phone Purchase not found" });
    }
    res.status(200).json(bulkPhonePurchase);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Bulk Phone Purchase", error: error.message });
  }
};

// Edit Bulk Phone Purchase by ID
// router.put("/bulk-phone-purchase/:id", 
exports.updateBulkPhone = async (req, res) => {
  try {
    const { id } = req.params;
    const { partyName, date, companyName, modelName, prices } = req.body;

    const updatedBulkPhonePurchase = await BulkPhonePurchase.findByIdAndUpdate(
      id,
      { partyName, date, companyName, modelName, prices },
      { new: true }
    );

    if (!updatedBulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk Phone Purchase not found" });
    }

    res.status(200).json({ message: "Bulk Phone Purchase updated successfully", data: updatedBulkPhonePurchase });
  } catch (error) {
    res.status(500).json({ message: "Error updating Bulk Phone Purchase", error: error.message });
  }
};

// Delete Bulk Phone Purchase by ID
// router.delete("/bulk-phone-purchase/:id",
exports.deleteBulkPhone = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related RamSim and Imei entries
    const bulkPhonePurchase = await BulkPhonePurchase.findById(id);
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk Phone Purchase not found" });
    }

    for (const ramSimId of bulkPhonePurchase.ramSimDetails) {
      const ramSim = await RamSim.findById(ramSimId);
      if (ramSim) {
        await Imei.deleteMany({ ramSimId: ramSim._id });
        await ramSim.remove();
      }
    }

    await bulkPhonePurchase.remove();

    res.status(200).json({ message: "Bulk Phone Purchase deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Bulk Phone Purchase", error: error.message });
  }
};


exports.sellPhonesFromBulk = async (req, res) => {
  try {
    const { bulkPhonePurchaseId, imeiNumbers, salePrice, warranty } = req.body;

    // Validate required fields
    // if (!bulkPhonePurchaseId || !imeiNumbers || !Array.isArray(imeiNumbers) || imeiNumbers.length === 0) {
    //   return res.status(400).json({ message: "Invalid data: imeiNumbers must be a non-empty array" });
    // }

    if (!salePrice || !warranty) {
      return res.status(400).json({ message: "Sale price and warranty are required" });
    }

    // Find the bulk phone purchase
    const bulkPhonePurchase = await BulkPhonePurchase.findById(bulkPhonePurchaseId).populate({
      path: 'ramSimDetails',
      populate: {
        path: 'imeiNumbers'
      }
    });

    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk phone purchase not found" });
    }

    const soldPhones = [];

    // Extract phones to be sold based on IMEI numbers
    for (const imei of imeiNumbers) {
      const ramSim = bulkPhonePurchase.ramSimDetails.find(ramSim => 
        ramSim.imeiNumbers.some(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei)
      );

      if (!ramSim) {
        return res.status(404).json({ message: `Phone with IMEI ${imei} not found in this bulk purchase` });
      }

      // Find the IMEI record that matches the provided IMEI number
      const imeiRecord = ramSim.imeiNumbers.find(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei);

      // Create a new SoldPhone record
      const soldPhone = new SoldPhone({
        bulkPhonePurchaseId,
        imei1: imeiRecord.imei1,
        imei2: imeiRecord.imei2 || null, // Handle missing imei2
        salePrice,
        warranty
      });

      // Save the sold phone record
      const savedSoldPhone = await soldPhone.save();
      soldPhones.push(savedSoldPhone);

      // Remove the sold IMEI from the bulk purchase's RamSim and Imei collection
      await Imei.findByIdAndDelete(imeiRecord._id);
      ramSim.imeiNumbers = ramSim.imeiNumbers.filter(imei => imei._id.toString() !== imeiRecord._id.toString());
      await ramSim.save();
    }

    // Check if all phones are sold
    const remainingPhones = bulkPhonePurchase.ramSimDetails.some(ramSim => ramSim.imeiNumbers.length > 0);

    if (bulkPhonePurchase.ramSimDetails.length === 0) { // ✅ Check if no phones are left
      bulkPhonePurchase.status = "Sold"; // ✅ Update status
      await bulkPhonePurchase.save();
    
      // ✅ Delete bulk purchase after marking it as sold
  
    }
    if(bulkPhonePurchase.ramSimDetails[0].imeiNumbers.length === 0 && !bulkPhonePurchase.ramSimDetails[1]|| bulkPhonePurchase.ramSimDetails[1].imeiNumbers.length===0){
      await BulkPhonePurchase.findByIdAndDelete(bulkPhonePurchase._id);
      return res.status(200).json({ message: "All phones sold. Bulk purchase deleted." });
    }
    
    res.status(200).json({
      message: "Phones sold successfully",
      soldPhones,
      statusUpdated: !remainingPhones ? "Bulk purchase is fully sold" : "Partial sale completed"
    });
    

  } catch (error) {
    console.error("Error selling phones:", error);
    res.status(500).json({ message: "Error selling phones", error: error.message });
  }
};





// Get all sales (both single and bulk)
exports.getAllSales = async (req, res) => {
    try {
        const allSales = await SoldPhone.find()
            // .populate({
            //     path: 'bulkPhonePurchaseId',
            //     model: 'BulkPhonePurchase',
            // });
      
        const responseData = allSales.map(sale => ({
            ...sale.toObject(),
            type: sale.bulkPhonePurchaseId ? 'Bulk Phone' : 'Single Phone', // Check if the sale is linked to a bulk purchase
        }));

        res.status(200).json({
            message: "Sales retrieved successfully!",
            data: responseData,
        });
    } catch (error) {
        console.error("Error fetching sales:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

