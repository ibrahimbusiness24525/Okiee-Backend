const multer = require('multer');
const { Imei, RamSim, BulkPhonePurchase, PurchasePhone,SoldPhone, SingleSoldPhone } = require("../schema/purchasePhoneSchema");
const { default: mongoose } = require('mongoose');
const { invoiceGenerator } = require('../services/invoiceGenerator');
const PartyLedger = require('../schema/PartyLedgerSchema');


exports.addPurchasePhone = async (req, res) => {
  const {
      name, fatherName, companyName, modelName, date, cnic,
      accessories, phoneCondition, specifications, ramMemory,batteryHealth,
      color, imei1, imei2, mobileNumber, isApprovedFromEgadgets,
      purchasePrice, finalPrice, demandPrice,warranty,shopid
  } = req.body;
  // const phonePicture = req.files['phonePicture']?.[0]?.path;
  // const personPicture = req.files['personPicture']?.[0]?.path;
  // const eGadgetStatusPicture = req.files['eGadgetStatusPicture']?.[0]?.path;
  // console.log("This is phone picture", phonePicture)
    try {

        console.log("This is name",name)
        // Create a new entry

        const purchasePhone = new PurchasePhone({
            userId: req.user.id,
            shopid,
            warranty,
            name,
            fatherName,
            companyName,
            modelName,
            date,
            cnic,
            batteryHealth,
            accessories,
            phoneCondition,
            specifications,
            ramMemory,
            color,
            imei1,
            imei2,
            // phonePicture,
            // personPicture,
            mobileNumber,
            price: {
                purchasePrice,
                finalPrice,
                demandPrice,
            },
            isApprovedFromEgadgets,
            // eGadgetStatusPicture,
        });

        // Save to database
        const savedPhone = await purchasePhone.save();
        res.status(201).json({ message: 'Purchase phone slip created successfully!', data: savedPhone });
    } catch (error) {
        console.error('Error creating purchase phone slip:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// exports.sellSinglePhone = async (req, res) => {
//   try {
//     const { purchasePhoneId, customerName, cnicFrontPic, cnicBackPic, finalPrice, warranty,sellingPaymentType,accesssoryAmount,accesssoryName } = req.body;

//     console.log("Received Data:", req.body);
    
//     // Fetch the purchased phone details
//     const purchasedPhone = await PurchasePhone.findById(purchasePhoneId);
//     if (!purchasedPhone) {
//       return res.status(404).json({ message: "Purchased phone not found" });
//     }

//     console.log("Purchased Phone Data:", purchasedPhone);

//     // Ensure the phone is not already sold
//     if (purchasedPhone.isSold) {
//       return res.status(400).json({ message: "This phone is already sold" });
//     }

//     // Set warranty based on condition
//     const updatedWarranty = purchasedPhone.phoneCondition === "Used" ? warranty : "12 months";

//     // Ensure user ID exists
//     if (!req.user?.id) {
//       return res.status(401).json({ message: "Unauthorized: User ID missing" });
//     }

//     // Create a new sold phone entry
//     const soldPhone = new SingleSoldPhone({
//       purchasePhoneId,
//       userId: req.user.id,
//       shopid: purchasedPhone.shopid,
//       customerName,
//       cnicFrontPic,
//       cnicBackPic,
//       mobileNumber: purchasedPhone.mobileNumber,
//       name: purchasedPhone.name,
//       fatherName: purchasedPhone.fatherName,
//       companyName: purchasedPhone.companyName,
//       modelName: purchasedPhone.modelName,
//       purchaseDate: purchasedPhone.date,
//       saleDate: new Date(),
//       phoneCondition: purchasedPhone.phoneCondition,
//       warranty: updatedWarranty,
//       specifications: purchasedPhone.specifications,
//       ramMemory: purchasedPhone.ramMemory,
//       color: purchasedPhone.color,
//       imei1: purchasedPhone.imei1,
//       imei2: purchasedPhone.imei2,
//       phonePicture: purchasedPhone.phonePicture,
//       personPicture: purchasedPhone.personPicture,
//       accessories: purchasedPhone.accessories,
//       purchasePrice: purchasedPhone.price.purchasePrice,
//       finalPrice: finalPrice || purchasedPhone.price.finalPrice,
//       demandPrice: purchasedPhone.price.demandPrice,
//       isApprovedFromEgadgets: purchasedPhone.isApprovedFromEgadgets,
//       eGadgetStatusPicture: purchasedPhone.eGadgetStatusPicture,
//       sellingPaymentType,
//       accesssoryAmount,
//       accesssoryName,
//       invoiceNumber: "INV-" + new Date().getTime(),
//     });

//     // Validate the object before saving
//     const validationError = soldPhone.validateSync();
//     if (validationError) {
//       console.error("Validation Error:", validationError);
//       return res.status(400).json({ message: "Validation failed", error: validationError });
//     }

//     // Save the sold phone
//     await soldPhone.save();

//     // Mark purchased phone as sold and remove it
//     purchasedPhone.isSold = true;
//     purchasedPhone.soldDetails = soldPhone._id;
//     await PurchasePhone.findByIdAndDelete(purchasePhoneId); // Fixes deletion issue

//     res.status(201).json({ message: "Phone sold successfully", soldPhone });
//   } catch (error) {
//     console.error("Error selling phone:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };
exports.sellSinglePhone = async (req, res) => {
  try {
    const { 
      purchasePhoneId, 
      customerName, 
      cnicFrontPic, 
      cnicBackPic, 
      finalPrice, 
      warranty, 
      salePrice,
      totalInvoice,
      sellingPaymentType, 
      accessories,
      // accesssoryAmount, 
      // accesssoryName, 
      bankName, 
      payableAmountNow, 
      payableAmountLater, 
      payableAmountLaterDate, 
      exchangePhoneDetail 
    } = req.body;

    console.log("Received Data:", req.body);
    
    // Fetch the purchased phone details
    const purchasedPhone = await PurchasePhone.findById(purchasePhoneId);
    if (!purchasedPhone) {
      return res.status(404).json({ message: "Purchased phone not found" });
    }

    console.log("Purchased Phone Data:", purchasedPhone);

    // Ensure the phone is not already sold
    if (purchasedPhone.isSold) {
      return res.status(400).json({ message: "This phone is already sold" });
    }

    // Set warranty based on condition
    const updatedWarranty = purchasedPhone.phoneCondition === "Used" ? warranty : "12 months";

    // Ensure user ID exists
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // **Validate conditional fields based on sellingPaymentType**
    if (sellingPaymentType === "Bank" && !bankName) {
      return res.status(400).json({ message: "Bank Name is required for Bank payment type." });
    }
    if (sellingPaymentType === "Credit" && (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)) {
      return res.status(400).json({ message: "All credit payment fields (Now, Later, Date) are required." });
    }
    if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
      return res.status(400).json({ message: "Exchange phone details are required for Exchange payment type." });
    }

    // Create a new sold phone entry
    const soldPhone = new SingleSoldPhone({
      purchasePhoneId,
      userId: req.user.id,
      shopid: purchasedPhone.shopid,
      customerName,
      accessories:accessories,
      cnicFrontPic,
      salePrice: salePrice,
      totalInvoice: totalInvoice,
      cnicBackPic,
      mobileNumber: purchasedPhone.mobileNumber,
      name: purchasedPhone.name,
      fatherName: purchasedPhone.fatherName,
      companyName: purchasedPhone.companyName,
      modelName: purchasedPhone.modelName,
      purchaseDate: purchasedPhone.date,
      saleDate: new Date(),
      phoneCondition: purchasedPhone.phoneCondition,
      warranty: updatedWarranty,
      specifications: purchasedPhone.specifications,
      ramMemory: purchasedPhone.ramMemory,
      color: purchasedPhone.color,
      imei1: purchasedPhone.imei1,
      imei2: purchasedPhone.imei2,
      phonePicture: purchasedPhone.phonePicture,
      personPicture: purchasedPhone.personPicture,
      // accessories: purchasedPhone.accessories,
      purchasePrice: purchasedPhone.price.purchasePrice,
      finalPrice: finalPrice || purchasedPhone.price.finalPrice,
      demandPrice: purchasedPhone.price.demandPrice,
      isApprovedFromEgadgets: purchasedPhone.isApprovedFromEgadgets,
      eGadgetStatusPicture: purchasedPhone.eGadgetStatusPicture,
      sellingPaymentType,
      // accesssoryAmount,
      // accesssoryName,
      bankName: sellingPaymentType === "Bank" ? bankName : undefined,
      payableAmountNow: sellingPaymentType === "Credit" ? payableAmountNow : undefined,
      payableAmountLater: sellingPaymentType === "Credit" ? payableAmountLater : undefined,
      payableAmountLaterDate: sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
      exchangePhoneDetail: sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
      invoiceNumber: "INV-" + new Date().getTime(),
    });

    // Validate the object before saving
    const validationError = soldPhone.validateSync();
    if (validationError) {
      console.error("Validation Error:", validationError);
      return res.status(400).json({ message: "Validation failed", error: validationError });
    }

    // Save the sold phone
    await soldPhone.save();

    // Mark purchased phone as sold and remove it
    purchasedPhone.isSold = true;
    purchasedPhone.soldDetails = soldPhone._id;
    await PurchasePhone.findByIdAndDelete(purchasePhoneId); // Fixes deletion issue

    res.status(201).json({ message: "Phone sold successfully", soldPhone });
  } catch (error) {
    console.error("Error selling phone:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


exports.getAllSingleSoldPhones = async (req, res) => {
  try {
    const soldPhones = await SingleSoldPhone.find({userId: req.user.id})
      .populate("userId", "name email") // Populate user details (optional)
      .populate({
        path: "purchasePhoneId",
        model: "PurchasePhone",  // Explicitly specify the model
        select: "companyName modelName imei1 imei2", // Select required fields
      });// If needed, get original phone details

    if (!soldPhones || soldPhones.length === 0) {
      return res.status(404).json({ message: "No sold phones found" });
    }

    res.status(200).json({ success: true, soldPhones });
  } catch (error) {
    console.error("Error fetching sold phones:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


////////get sold phone by id////////////
exports.getSingleSoldPhoneById = async (req, res) => {
  const { id } = req.params;

  try {
    const soldPhoneDetail = await SingleSoldPhone.findById(id);
    if (!soldPhoneDetail) {
      return res.status(404).json({ message: "Sold phone not found" });
    }
    if(!req.user.id || !req.user){
      return res.status(404).json({ message: "Authenticate please" });

    }
    res.status(200).json({ success: true, soldPhoneDetail });
  } catch (error) {
    console.error("Error getting sold phone detail:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}


// get bulk sold phone by id
exports.getBulkSoldPhoneById = async(req,res) =>{
  const {id}= req.params;
  try{
    const soldPhoneDetail = await SoldPhone.findById(id);
    if (!soldPhoneDetail) {
      return res.status(404).json({ message: "Sold phone not found" });
    }
    if(!req.user.id || !req.user){
      return res.status(404).json({ message: "Authenticate please" });

    }
    res.status(200).json({ success: true, soldPhoneDetail });
  }catch(error){
    console.error("Error getting detail:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}



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
  try {
      // Fetch all purchase phone slips for the logged-in user
      const purchasePhones = await PurchasePhone.find({ userId: req.user.id }).populate("soldDetails");

      // Format the response to match the required structure
      const formattedPhones = purchasePhones.map(phone => ({
          name: phone.name,
          _id: phone._id,
          images: phone.images || [],
          cnic: phone.cnic,
          modelName: phone.modelName,
          batteryHealth: phone.batteryHealth || "",
          ramMemory: phone.ramMemory,
          mobileNumber: phone.mobileNumber,
          date: phone.date,
          price:{
          purchasePrice: phone.price.purchasePrice,
          finalPrice: phone.price.finalPrice,
          demandPrice: phone.price.demandPrice,
          },
          // accessories: [
          //   phone.accessories?.box ? "box" : null,
          //   phone.accessories?.charger ? "charger" : null,
          //   phone.accessories?.handFree ? "handFree" : null,
          // ].filter(Boolean),
          accessories:{
          box: phone.accessories.box,
          charger: phone.accessories.charger,
          handfree: phone.accessories.handFree,
          },
           // Ensure images field exists
          companyName: phone.companyName,
          specifications:phone.specifications,
          modelSpecifications: phone.modelName, // Assuming modelName is equivalent
          specs: `${phone.ramMemory} GB, ${phone.specifications}`, // Adjust as per actual field names
          phoneCondition: phone.phoneCondition,
          imei1: phone.imei1,
          imei2: phone.imei2 || "",
          demandPrice: phone.price?.demandPrice || 0,
          purchasePrice: phone.price?.purchasePrice || 0,
          finalPrice: phone.price?.finalPrice || 0,
          shopId: phone.shopid, // Ensure correct mapping
          color: phone.color,
          isSold:phone.isSold,
          warranty: phone.warranty,
          __v: phone.__v,
      }));

      res.status(200).json({
          message: "Phones retrieved successfully!",
          phones: formattedPhones
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
      const purchasePhones = await PurchasePhone.find({userId: req.user.id}).populate("soldDetails");
      console.log("Tis is userIdd",req.user.id)
      // Fetch all bulk purchased phones with RAM and IMEI details
      const bulkPhones = await BulkPhonePurchase.find({userId: req.user.id})
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
exports.updateSinglePurchasePhone = async (req, res) => {
  console.log("Received data:", req.body)
    try{
      const {id} =  req.params;
      const updateData = req.body;

      const existingPhone = await PurchasePhone.findById(id);
      if(!existingPhone) return res.status(404).json({message: "Phone not found"})
        const updatedPhone = await PurchasePhone.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedPhone) {
          return res.status(404).json({ message: "Purchase phone slip not found" });
        }
      res.status(200).json({message: "Purchase Phone updated successfully", data: updatedPhone})
    }catch(error){
      console.error("Error updating purchase phone:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};

// Delete Purchase Phone Slip
exports.deletePurchasePhone = async (req, res) => {
  try {
      const userId = req.user.id; // Extract from token (assuming middleware is used)
      const { id } = req.params;

      // Find the phone slip
      const deletedPhone = await PurchasePhone.findById(id);

      if (!deletedPhone) {
          return res.status(404).json({ message: 'Purchase phone slip not found' });
      }

      // Check if the user is authorized (e.g., only the user who added it or an admin)
      if (deletedPhone.userId.toString() !== userId) {
          return res.status(403).json({ message: 'Unauthorized to delete this purchase phone slip' });
      }

      // Delete the document
      await PurchasePhone.findByIdAndDelete(id);

      res.status(200).json({ message: 'Purchase phone slip deleted successfully!', data: deletedPhone });
  } catch (error) {
      console.error('Error deleting purchase phone slip:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// exports.addBulkPhones = async (req, res) => {
//   try {
//     console.log("Incoming Request Body:", req.body); // Debugging

//     const { partyName, date, companyName, modelName, ramSimDetails, prices,purchasePaymentStatus,purchasePaymentType,creditPaymentData={} } = req.body;
//   if(purchasePaymentType === "credit"){
//     if(Number(creditPaymentData.payableAmountNow) + Number(creditPaymentData.payableAmountLater) !== Number(prices.buyingPrice)){
//       return res.status(400).json({ message: "Invalid data: payable amount should be equal to buying price" });
//     }
//   }
//     if (!ramSimDetails || !Array.isArray(ramSimDetails)) {
//       return res.status(400).json({
//         message: "Invalid data: ramSimDetails must be an array and cannot be empty",
//       });
//     }

//     const party = await PartyLedger.findOne({ partyName }).select("_id").exec(); // Only fetch _id
//     if (!party) return { success: false, message: "Party not found" };

//     const bulkPhonePurchase = new BulkPhonePurchase({
//       partyLedgerId: party,
//       userId: req.user.id,
//       partyName,
//       date,
//       companyName,
//       modelName,
//       prices,
//       ramSimDetails: [], 
//       purchasePaymentType,
//       purchasePaymentStatus,
//       ...(purchasePaymentType === "credit" && { creditPaymentData }),
//     });
//     const totalAmountPaid = 
//     (Number(bulkPhonePurchase.creditPaymentData?.totalPaidAmount) || 0) + 
//     (Number(bulkPhonePurchase.creditPaymentData?.payableAmountNow) || 0);
  
//   bulkPhonePurchase.creditPaymentData.totalPaidAmount = totalAmountPaid;
//     const savedBulkPhonePurchase = await bulkPhonePurchase.save();

//     if (ramSimDetails.length > 0 && typeof ramSimDetails[0] === "string") {
//       savedBulkPhonePurchase.ramSimDetails = ramSimDetails;
//     } else {
//       const ramSimData = await Promise.all(
//         ramSimDetails.map(async (ramSim) => {
//           const newRamSim = new RamSim({
//             ramMemory: ramSim.ramMemory,
//             simOption: ramSim.simOption,  
//             priceOfOne: ramSim.priceOfOne,
//             bulkPhonePurchaseId: savedBulkPhonePurchase._id,
//           });

//           const savedRamSim = await newRamSim.save();

//           const imeiNumbers = await Promise.all(
//             (ramSim.imeiNumbers || []).map(async (imei) => {
//               const newImei = new Imei({
//                 imei1: imei.imei1,
//                 imei2: imei.imei2,
//                 ramSimId: savedRamSim._id,
//               });
//               return await newImei.save();
//             })
//           );

//           savedRamSim.imeiNumbers = imeiNumbers;
//           await savedRamSim.save();

//           return savedRamSim;
//         })
//       );

//       savedBulkPhonePurchase.ramSimDetails = ramSimData;
//     }

//     await savedBulkPhonePurchase.save();

//     res.status(201).json({
//       message: "Bulk Phone Purchase created successfully",
//       data: savedBulkPhonePurchase,
//     });
//   } catch (error) {
//     console.error("Error:", error); // Log error details
//     res.status(500).json({ message: "Error creating Bulk Phone Purchase", error: error.message });
//   }
// };

exports.addBulkPhones = async (req, res) => {
  try {
    console.log("Incoming Request Body:", req.body);

    const {
      partyName,
      date,
      companyName,
      modelName,
      ramSimDetails,
      prices,
      purchasePaymentStatus,
      purchasePaymentType,
      creditPaymentData = {},
    } = req.body;

    if (purchasePaymentType === "credit") {
      const total = Number(creditPaymentData.payableAmountNow) + Number(creditPaymentData.payableAmountLater);
      if (total !== Number(prices.buyingPrice)) {
        return res.status(400).json({ message: "Invalid data: payable amount should equal buying price" });
      }
    }

    if (!ramSimDetails || !Array.isArray(ramSimDetails)) {
      return res.status(400).json({ message: "Invalid data: ramSimDetails must be an array" });
    }

    const party = await PartyLedger.findOne({ partyName }).select("_id").exec();
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });

    const bulkPhonePurchase = new BulkPhonePurchase({
      partyLedgerId: party._id,
      userId: req.user.id,
      partyName,
      date,
      companyName,
      modelName,
      prices,
      purchasePaymentType,
      purchasePaymentStatus,
      ...(purchasePaymentType === "credit" && { creditPaymentData }),
    });

    if (purchasePaymentType === "credit") {
      const totalPaid = (Number(creditPaymentData.totalPaidAmount) || 0) + Number(creditPaymentData.payableAmountNow || 0);
      bulkPhonePurchase.creditPaymentData.totalPaidAmount = totalPaid;
    }

    const savedBulkPhonePurchase = await bulkPhonePurchase.save();

    const ramSimData = await Promise.all(
      ramSimDetails.map(async (ramSim) => {
        const newRamSim = new RamSim({
          companyName: ramSim.companyName,
          modelName: ramSim.modelName,
          batteryHealth: ramSim.batteryHealth,
          ramMemory: ramSim.ramMemory,
          simOption: ramSim.simOption,
          priceOfOne: ramSim.priceOfOne,
          bulkPhonePurchaseId: savedBulkPhonePurchase._id,
        });

        const savedRamSim = await newRamSim.save();

        const imeiNumbers = await Promise.all(
          (ramSim.imeiNumbers || []).map(async (imei) => {
            const newImei = new Imei({
              imei1: imei.imei1,
              imei2: imei.imei2,
              color: imei.color,
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
    await savedBulkPhonePurchase.save();

    res.status(201).json({
      message: "Bulk Phone Purchase created successfully",
      data: savedBulkPhonePurchase,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating Bulk Phone Purchase", error: error.message });
  }
};

//updateBulkPhone
exports.updateBulkPhonePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedPurchase = await BulkPhonePurchase.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({ message: 'BulkPhonePurchase not found' });
    }

    res.status(200).json({
      message: 'BulkPhonePurchase updated successfully',
      data: updatedPurchase,
    });
  } catch (error) {
    console.error('Error updating BulkPhonePurchase:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Bulk Phone Purchases
// router.get("/bulk-phone-purchase", 
exports.getBulkPhone = async (req, res) => {
  try {
    const bulkPhonePurchases = await BulkPhonePurchase.find({userId: req.user.id})
      .populate({
        path: "ramSimDetails",
        model: "RamSim", 
        populate: {
          path: "imeiNumbers",
          model: "Imei", 
        },
      })
      .lean(); 

  const updatedPurchases = bulkPhonePurchases.map(purchase => {
  const creditAmount = Number(purchase?.creditPaymentData?.payableAmountLater || 0);
  const buyingPrice = Number(purchase?.prices?.buyingPrice || 0);

  const actualBuyingPrice = Math.round(
    creditAmount > 0 ? buyingPrice + creditAmount : buyingPrice
  );

  return {
    ...purchase,
    actualBuyingPrice
  };
});

res.status(200).json(updatedPurchases); // ✅ Don't wrap in `{}` — it’s already an array

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
    const userId = req.user?.id; // Ensure userId exists

    // Find the BulkPhonePurchase document
    const bulkPhonePurchase = await BulkPhonePurchase.findById(id);
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk Phone Purchase not found" });
    }

    // Check if the user is authorized to delete
    if (!bulkPhonePurchase.userId.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized to delete this bulk phone purchase" });
    }

    // Delete related RamSim and Imei records
    const ramSimIds = bulkPhonePurchase.ramSimDetails; // Array of RamSim IDs
    if (ramSimIds.length > 0) {
      await Imei.deleteMany({ ramSimId: { $in: ramSimIds } }); // Delete IMEIs linked to RamSims
      await RamSim.deleteMany({ _id: { $in: ramSimIds } }); // Delete RamSim records
    }

    // Delete the bulkPhonePurchase document
    await BulkPhonePurchase.findByIdAndDelete(id);

    res.status(200).json({ message: "Bulk Phone Purchase deleted successfully" });
  } catch (error) {
    console.error("Error deleting Bulk Phone Purchase:", error);
    res.status(500).json({ message: "Error deleting Bulk Phone Purchase", error: error.message });
  }
};



// exports.sellPhonesFromBulk = async (req, res) => {
//   try {
//     const { 
//       bulkPhonePurchaseId, 
//       imeiNumbers,
//       salePrice,
//       totalInvoice,
//        warranty,
//        customerName,
//        cnicBackPic,
//        cnicFrontPic,
//        accessories,
//        sellingPaymentType,
//       //  accesssoryAmount,
//       //  accesssoryName,
//        bankName, 
//        payableAmountNow, 
//        payableAmountLater, 
//        payableAmountLaterDate, 
//        exchangePhoneDetail  
//       } = req.body;

    

//     if (!salePrice || !warranty) {
//       return res.status(400).json({ message: "Sale price and warranty are required" });
//     }

//     // Find the bulk phone purchase
//     const bulkPhonePurchase = await BulkPhonePurchase.findById(bulkPhonePurchaseId).populate({
//       path: 'ramSimDetails',
//       populate: {
//         path: 'imeiNumbers'
//       }
//     });

//     if (!bulkPhonePurchase) {
//       return res.status(404).json({ message: "Bulk phone purchase not found" });
//     }

//     const soldPhones = [];

//     // Extract phones to be sold based on IMEI numbers
//     for (const imei of imeiNumbers) {
//       const ramSim = bulkPhonePurchase.ramSimDetails.find(ramSim => 
//         ramSim.imeiNumbers.some(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei)
//       );

//       if (!ramSim) {
//         return res.status(404).json({ message: `Phone with IMEI ${imei} not found in this bulk purchase` });
//       }

//       // Find the IMEI record that matches the provided IMEI number
//       const imeiRecord = ramSim.imeiNumbers.find(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei);
//       if (sellingPaymentType === "Bank" && !bankName) {
//         return res.status(400).json({ message: "Bank Name is required for Bank payment type." });
//       }
//       if (sellingPaymentType === "Credit" && (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)) {
//         return res.status(400).json({ message: "All credit payment fields (Now, Later, Date) are required." });
//       }
//       if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
//         return res.status(400).json({ message: "Exchange phone details are required for Exchange payment type." });
//       }
//       // Create a new SoldPhone record
//       const soldPhone = new SoldPhone({
//         bulkPhonePurchaseId,
//         imei1: imeiRecord.imei1,
//         imei2: imeiRecord.imei2 || null, // Handle missing imei2
//         salePrice,
//         totalInvoice,
//         accessories,
//         customerName,
//         cnicBackPic,
//         cnicFrontPic,
//         sellingPaymentType,
//         // accesssoryAmount,
//         // accesssoryName,
//         warranty,
//         userId: req.user.id,
//         invoiceNumber: invoiceGenerator(),
//         bankName: sellingPaymentType === "Bank" ? bankName : undefined,
//         payableAmountNow: sellingPaymentType === "Credit" ? payableAmountNow : undefined,
//         payableAmountLater: sellingPaymentType === "Credit" ? payableAmountLater : undefined,
//         payableAmountLaterDate: sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
//         exchangePhoneDetail: sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
//       });

//       // Save the sold phone record
//       const savedSoldPhone = await soldPhone.save();
//       soldPhones.push(savedSoldPhone);

//       // Remove the sold IMEI from the bulk purchase's RamSim and Imei collection
//       await Imei.findByIdAndDelete(imeiRecord._id);
//       ramSim.imeiNumbers = ramSim.imeiNumbers.filter(imei => imei._id.toString() !== imeiRecord._id.toString());
//       await ramSim.save();
//     }

//     // Check if all phones are sold
//     const remainingPhones = bulkPhonePurchase.ramSimDetails.some(ramSim => ramSim.imeiNumbers.length > 0);

//     if (bulkPhonePurchase.ramSimDetails.length === 0) { // ✅ Check if no phones are left
//       bulkPhonePurchase.status = "Sold"; // ✅ Update status
//       await bulkPhonePurchase.save();
    
//       // ✅ Delete bulk purchase after marking it as sold
  
//     }
//     if(bulkPhonePurchase.ramSimDetails[0].imeiNumbers.length === 0 && !bulkPhonePurchase.ramSimDetails[1]|| bulkPhonePurchase.ramSimDetails[1].imeiNumbers.length===0){
//       await BulkPhonePurchase.findByIdAndDelete(bulkPhonePurchase._id);
//       return res.status(200).json({ message: "All phones sold. Bulk purchase deleted." });
//     }
    
//     res.status(200).json({
//       message: "Phones sold successfully",
//       soldPhones,
//       statusUpdated: !remainingPhones ? "Bulk purchase is fully sold" : "Partial sale completed"
//     });
    

//   } catch (error) {
//     console.error("Error selling phones:", error);
//     res.status(500).json({ message: "Error selling phones", error: error.message });
//   }
// };
exports.sellPhonesFromBulk = async (req, res) => {
  try {
    const { 
      bulkPhonePurchaseId, 
      imeiNumbers,
      salePrice,
      totalInvoice,
      warranty,
      customerName,
      cnicBackPic,
      cnicFrontPic,
      accessories,
      sellingPaymentType,
      bankName, 
      payableAmountNow, 
      payableAmountLater, 
      payableAmountLaterDate, 
      exchangePhoneDetail  
    } = req.body;

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

    for (const imei of imeiNumbers) {
      const ramSim = bulkPhonePurchase.ramSimDetails.find(ramSim => 
        ramSim.imeiNumbers.some(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei)
      );

      if (!ramSim) {
        return res.status(404).json({ message: `Phone with IMEI ${imei} not found in this bulk purchase` });
      }

      const imeiRecord = ramSim.imeiNumbers.find(imeiRecord => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei);
      if (sellingPaymentType === "Bank" && !bankName) {
        return res.status(400).json({ message: "Bank Name is required for Bank payment type." });
      }
      if (sellingPaymentType === "Credit" && (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)) {
        return res.status(400).json({ message: "All credit payment fields (Now, Later, Date) are required." });
      }
      if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
        return res.status(400).json({ message: "Exchange phone details are required for Exchange payment type." });
      }

      // Create a new SoldPhone record
      const soldPhone = new SoldPhone({
        bulkPhonePurchaseId,
        imei1: imeiRecord.imei1,
        imei2: imeiRecord.imei2 || null, 
        salePrice,
        totalInvoice,
        accessories,
        customerName,
        cnicBackPic,
        cnicFrontPic,
        sellingPaymentType,
        warranty,
        userId: req.user.id,
        invoiceNumber: invoiceGenerator(),
        bankName: sellingPaymentType === "Bank" ? bankName : undefined,
        payableAmountNow: sellingPaymentType === "Credit" ? payableAmountNow : undefined,
        payableAmountLater: sellingPaymentType === "Credit" ? payableAmountLater : undefined,
        payableAmountLaterDate: sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
        exchangePhoneDetail: sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
      });

      await soldPhone.save();
      soldPhones.push(soldPhone);

      // Remove IMEI from `Imei` collection
      await Imei.findByIdAndDelete(imeiRecord._id);
      
      // Update `ramSimDetails`
      ramSim.imeiNumbers = ramSim.imeiNumbers.filter(record => record._id.toString() !== imeiRecord._id.toString());
      await ramSim.save();
    }

    // Reload the bulk purchase to ensure updates are reflected
    const updatedBulkPhonePurchase = await BulkPhonePurchase.findById(bulkPhonePurchaseId).populate("ramSimDetails");

    // If no phones are left, delete the bulk purchase safely
    if (!updatedBulkPhonePurchase || updatedBulkPhonePurchase.ramSimDetails.every(ramSim => ramSim.imeiNumbers.length === 0)) {
      await BulkPhonePurchase.findByIdAndDelete(bulkPhonePurchaseId);
      return res.status(200).json({ message: "All phones sold. Bulk purchase deleted.", soldPhones });
    }

    res.status(200).json({
      message: "Phones sold successfully",
      soldPhones,
      statusUpdated: "Partial sale completed"
    });

  } catch (error) {
    console.error("Error selling phones:", error);
    res.status(500).json({ message: "Error selling phones", error: error.message });
  }
};
 




// Get all sales (both single and bulk)
exports.getAllSales = async (req, res) => {
    try {
      // const pageNumber = req.query.page || 1;
      // const pageSize = 10;
      // SoldPhone.paginate({},{page: pageNumber,limit: pageSize},(err,result)=>{
      //   if(err){
      //     return res.status(500).json({message: "Error while fetching the sold phones"})
      //   }

      //   const {docs, total, limit, page, pages} = result;
      //   res.json({users: docs, total, limit, page, pages})
      // })
        const allSales = await SoldPhone.find({userId: req.user.id})  
      
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
exports.getSoldBulkPhoneDetailById = async (req, res) => {
    try {
      const {id} = req.params;
        const saleDetail = await SoldPhone.findById(id).populate({
                path: 'bulkPhonePurchaseId',
                model: 'BulkPhonePurchase',
            });

        res.status(200).json({
            message: "Sales detail retrived successfully!",
            data: saleDetail,
        });
    } catch (error) {
        console.error("Error fetching dwetail:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getDeviceByImei = async(req,res) =>{
  try {
    const userId = req.user.id; // Extract user ID from request
    const { imei } = req.query;

    if (!imei) {
      return res.status(400).json({ error: "IMEI number is required." });
    }

    // Search in BulkPhonePurchase (filtered by user ID)
    const bulkPhone = await BulkPhonePurchase.findOne({
      userId, // Ensure it belongs to the logged-in user
      $or: [{ "imeiNumbers.imei1": imei }, { "imeiNumbers.imei2": imei }],
    }).populate("ramSimDetails");

    // Search in PurchasePhone (filtered by user ID)
    const purchasePhone = await PurchasePhone.findOne({
      userId, // Ensure it belongs to the logged-in user
      $or: [{ imei1: imei }, { imei2: imei }],
    }).populate("shopid userId soldDetails");

    if (!bulkPhone && !purchasePhone) {
      return res.status(404).json({ error: "No phone details found for this user." });
    }

    res.status(200).json({ bulkPhone, purchasePhone });
  } catch (error) {
    console.error("Error fetching phone details:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

exports.payBulkPurchaseCreditAmount = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from request
    const bulkPhonePurchaseId = req.params.id;
    const{amountToPay} = req.body;
    const bulkPhonePurchase = await BulkPhonePurchase.findById(bulkPhonePurchaseId);
    if(!userId){
      return res.status(404).json({ message: "Authenticate please" });
    }
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk phone purchase not found" });
    }
    if(bulkPhonePurchase.purchasePaymentStatus === "Paid"){
      return res.status(400).json({ message: "Payment already made" });
    }
    if (bulkPhonePurchase.creditPaymentData.payableAmountLater === 0 || 
      bulkPhonePurchase.creditPaymentData.payableAmountLater === "0") {
    return res.status(400).json({ message: "No amount to pay" });
  }
  
    const response = Number(bulkPhonePurchase.creditPaymentData.payableAmountLater) - Number(amountToPay);
    if(response < 0){
      return res.status(400).json({ message: "Amount to pay is greater than payable amount" });
    }
    bulkPhonePurchase.creditPaymentData.payableAmountLater = response;
    if(response === 0){
      bulkPhonePurchase.purchasePaymentStatus = "paid";
    }
  
  // Initialize totalPaidAmount with payableAmountNow if it's the first payment
// if (!bulkPhonePurchase.creditPaymentData.totalPaidAmount) {
//   bulkPhonePurchase.creditPaymentData.totalPaidAmount = Number(bulkPhonePurchase.creditPaymentData.payableAmountNow) || 0;
// }

// Add amountToPay to totalPaidAmount
bulkPhonePurchase.creditPaymentData.totalPaidAmount += Number(amountToPay);

    
    bulkPhonePurchase.save();
    res.status(200).json({ message: "Payment made successfully", bulkPhonePurchase });
  }catch(error){
    console.error("Error paying credit amount:", error);
    res.status(500).json({ message: "Internal server error", error });

  }
}
