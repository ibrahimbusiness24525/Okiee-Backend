const multer = require('multer');
const { Imei, RamSim, BulkPhonePurchase, PurchasePhone,SoldPhone, SingleSoldPhone, Dispatch } = require("../schema/purchasePhoneSchema");
const { default: mongoose } = require('mongoose');
const { invoiceGenerator } = require('../services/invoiceGenerator');
const PartyLedger = require('../schema/PartyLedgerSchema');
const { AddBankAccount, BankTransaction } = require('../schema/BankAccountSchema');
const { PocketCashTransaction } = require('../schema/PocketCashSchema');


exports.addPurchasePhone = async (req, res) => {
  const {
      name, fatherName, companyName, modelName, date, cnic,
      accessories, phoneCondition, specifications, ramMemory,batteryHealth,
      color, imei1, imei2, mobileNumber, isApprovedFromEgadgets,
      purchasePrice, finalPrice, demandPrice,warranty,shopid,      bankAccountUsed,pocketCash,accountCash

  } = req.body;
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
        if (bankAccountUsed) {
          const bank = await AddBankAccount.findById(bankAccountUsed);
          if (!bank) return res.status(404).json({ message: "Bank not found" });
    
          // Deduct purchasePrice from accountCash
          bank.accountCash -= accountCash;
          await bank.save();
    
          // Log the transaction
          await BankTransaction.create({
            bankId: bank._id,
            userId: req.user.id,
            reasonOfAmountDeduction: `Purchase of mobile of company name: ${companyName} and model name: ${modelName}`,
            accountCash:accountCash,
            accountType: bank.accountType,
          });
        }
        if (pocketCash) {
          const pocketTransaction = await PocketCashTransaction.findOne({ userId: req.user.id });
          if (!pocketTransaction) {
            return res.status(404).json({ message: 'Pocket cash account not found.' });
          }
    console.log("pocket cash", pocketTransaction.accountCash)
          // Check if the user has enough pocket cash
          if (pocketTransaction.accountCash < pocketCash) {
            return res.status(400).json({ message: 'Insufficient pocket cash' });
          }
    
          // Deduct the pocket cash amount
          pocketTransaction.accountCash -= pocketCash;
          await pocketTransaction.save();
    
          // Log the pocket cash transaction
          await PocketCashTransaction.create({
            userId: req.user.id,
            amountDeducted:pocketCash,
            remainingAmount: pocketTransaction.accountCash - pocketCash,
            reasonOfAmountDeduction: `Purchase of mobile from company: ${companyName} model: ${modelName}`,
            sourceOfAmountAddition: 'Payment for purchase',
          });
        }
    
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
      customerNumber,
      saleDate,
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
      customerNumber,
      saleDate,
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
          dispatch:phone.dispatch,
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
        console.log("imeinumbersdetail:", ramSim.imeiNumbers); // Debugging
        const imeiNumbers = await Promise.all(
          (ramSim.imeiNumbers || []).map(async (imei) => {
            const newImei = new Imei({
              imei1: imei.imei1,
              imei2: imei.imei2,
              color: imei.color,
              batteryHealth: imei.batteryHealth,
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
    const {
      partyName,
      date,
      purchasePaymentType,
      purchasePaymentStatus,
      creditPaymentData,
      prices,
      ramSimDetails, // full objects
    } = req.body;

    // 1. Update BulkPhonePurchase basic info
    const updatedBulkPurchase = await BulkPhonePurchase.findByIdAndUpdate(
      id,
      {
        partyName,
        date,
        purchasePaymentType,
        purchasePaymentStatus,
        creditPaymentData,
        prices,
      },
      { new: true, runValidators: true }
    );

    // 2. Handle ramSimDetails update
    const ramSimIds = [];

    for (const ramSim of ramSimDetails) {
      let ramSimDoc;
      
      if (ramSim._id) {
        ramSimDoc = await RamSim.findByIdAndUpdate(
          ramSim._id,
          {
            companyName: ramSim.companyName,
            modelName: ramSim.modelName,
            batteryHealth: ramSim.batteryHealth,
            ramMemory: ramSim.ramMemory,
            simOption: ramSim.simOption,
            priceOfOne: ramSim.priceOfOne,
          },
          { new: true, runValidators: true }
        );
      } else {
        ramSimDoc = new RamSim({
          companyName: ramSim.companyName,
          modelName: ramSim.modelName,
          batteryHealth: ramSim.batteryHealth,
          ramMemory: ramSim.ramMemory,
          simOption: ramSim.simOption,
          priceOfOne: ramSim.priceOfOne,
          bulkPhonePurchaseId: id,
        });
        await ramSimDoc.save();
      }

      // 3. Handle Imei creation/update
      const imeiIds = [];

      for (const imei of ramSim.imeiNumbers) {
        const imeiDoc = new Imei({
          imei1: imei.imei1,
          imei2: imei.imei2,
          ramSimId: ramSimDoc._id,
        });
        await imeiDoc.save();
        imeiIds.push(imeiDoc._id);
      }

      ramSimDoc.imeiNumbers = imeiIds;
      await ramSimDoc.save();

      ramSimIds.push(ramSimDoc._id);
    }

    updatedBulkPurchase.ramSimDetails = ramSimIds;
    await updatedBulkPurchase.save();

    res.status(200).json({
      message: 'BulkPhonePurchase updated successfully',
      data: updatedBulkPurchase,
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
    dispatch: purchase.dispatch ?? false, 
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
      dateSold,
      customerNumber,
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
        customerNumber,
        dateSold,
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


// Dispatch a single purchase phone
exports.dispatchSinglePurchase = async (req, res) => {
  try {
    const { shopName, receiverName } = req.body;
    const purchasePhoneId = req.params.id;
    const userId = req.user.id;

    await PurchasePhone.findByIdAndUpdate(purchasePhoneId, { dispatch: true });

    const dispatchEntry = await Dispatch.create({
      userId,
      shopName,
      receiverName,
      purchasePhoneId,
    });

    res.status(200).json({ message: "Phone dispatched", dispatch: dispatchEntry });
  } catch (error) {
    console.error("Error dispatching single phone:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.dispatchSingleReturn = async (req, res) => {
  try {
    const purchasePhoneId = req.params.id;
    const userId = req.user.id;

    // 1. Update PurchasePhone dispatch status to false
    const updatedPhone = await PurchasePhone.findByIdAndUpdate(
      purchasePhoneId,
      { dispatch: false },
      { new: true }
    );

    if (!updatedPhone) {
      return res.status(404).json({ message: "Purchase phone not found" });
    }

    // 2. Delete the corresponding Dispatch entry
    const deletedDispatch = await Dispatch.findOneAndDelete({ purchasePhoneId, userId });

    if (!deletedDispatch) {
      return res.status(404).json({ message: "Dispatch record not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Phone return processed successfully",
      phone: updatedPhone,
      dispatch: deletedDispatch,
    });
  } catch (error) {
    console.error("Error returning dispatched phone:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



// Dispatch a bulk purchase
// exports.dispatchBulkPurchase = async (req, res) => {
//   try {
//     const { shopName, receiverName } = req.body;
//     const bulkPhonePurchaseId = req.params.id;
//     const userId = req.user.id;

//     await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: true });

//     const dispatchEntry = await Dispatch.create({
//       userId,
//       shopName,
//       receiverName,
//       bulkPhonePurchaseId,
//     });

//     res.status(200).json({ message: "Bulk phones dispatched", dispatch: dispatchEntry });
//   } catch (error) {
//     console.error("Error dispatching bulk phones:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

exports.dispatchBulkPurchase = async (req, res) => {
  try {
    const { shopName, receiverName, imeiArray = [] } = req.body;
    const bulkPhonePurchaseId = req.params.id;
    const userId = req.user.id;

    // Fetch bulk purchase
    const bulkPurchase = await BulkPhonePurchase.findById(bulkPhonePurchaseId);
    if (!bulkPurchase) {
      return res.status(404).json({ message: "Bulk purchase not found" });
    }

    // Get all RamSim entries linked to this bulk purchase
    const ramSimEntries = await RamSim.find({ bulkPhonePurchaseId });
    const ramSimIds = ramSimEntries.map(r => r._id);

    // Get all IMEI documents under those RamSim entries
    const allImeis = await Imei.find({ ramSimId: { $in: ramSimIds } });

    let imeisToDispatch;

    // If user passed imeiArray with imei1/imei2 structure
    if (imeiArray.length > 0) {
      const imei1List = imeiArray.map(item => item.imei1?.trim()).filter(Boolean);
      imeisToDispatch = allImeis.filter(i => imei1List.includes(i.imei1));

      if (imeisToDispatch.length === 0) {
        return res.status(400).json({ message: "No matching IMEI1s found for dispatch." });
      }
    } else {
      if (bulkPurchase.dispatch) {
        return res.status(400).json({ message: "Bulk phones already dispatched" });
      }
      imeisToDispatch = allImeis;
    }

    const imeiIdsToDispatch = imeisToDispatch.map(i => i._id);

    // Create Dispatch Entry
    const dispatchEntry = await Dispatch.create({
      userId,
      shopName,
      receiverName,
      bulkPhonePurchaseId,
      dispatchedImeiIds: imeiIdsToDispatch,
    });

    // Mark only the matched IMEIs as dispatched
    await Imei.updateMany(
      { _id: { $in: imeiIdsToDispatch } },
      { $set: { isDispatched: true } }
    );

    // Check if all IMEIs under this bulk purchase are now dispatched
    const undispatchedImeis = await Imei.find({
      ramSimId: { $in: ramSimIds },
      isDispatched: { $ne: true }
    });

    const allDispatched = undispatchedImeis.length === 0;

    if (allDispatched && !bulkPurchase.dispatch) {
      await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: true });
    }

    res.status(200).json({
      message: "Bulk phones dispatched",
      dispatch: dispatchEntry
    });

  } catch (error) {
    console.error("Error dispatching bulk phones:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


// exports.returnBulkDispatch = async (req, res) => {
//   try {
//     const dispatchId = req.params.id;
//     const { imeiArray = [] } = req.body;

//     // Find the dispatch entry
//     const dispatchEntry = await Dispatch.findById(dispatchId);
//     if (!dispatchEntry) {
//       return res.status(404).json({ message: "Dispatch entry not found" });
//     }

//     const bulkPhonePurchaseId = dispatchEntry.bulkPhonePurchaseId;
//     const dispatchedImeiIds = dispatchEntry.dispatchedImeiIds;

//     // Get full IMEI documents for the dispatch
//     const allImeis = await Imei.find({ _id: { $in: dispatchedImeiIds } });

//     let imeiIdsToReturn;

//     if (imeiArray.length > 0) {
//       // Return based on imei1 field
//       const imei1List = imeiArray.map(item => item.imei1?.trim()).filter(Boolean);

//       const filtered = allImeis.filter(i => imei1List.includes(i.imei1));
//       imeiIdsToReturn = filtered.map(i => i._id);

//       if (imeiIdsToReturn.length === 0) {
//         return res.status(400).json({ message: "No matching IMEIs found to return." });
//       }

//       // Update IMEIs as not dispatched
//       await Imei.updateMany(
//         { _id: { $in: imeiIdsToReturn } },
//         { $set: { isDispatched: false } }
//       );

//       // Check if any of the IMEI is returned, mark bulk purchase as undelivered
//       await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: false });

//       // Get remaining IMEIs
//       const remainingImeiIds = dispatchedImeiIds.filter(id => !imeiIdsToReturn.includes(id.toString()));

//       if (remainingImeiIds.length === 0) {
//         // All returned → delete dispatch
//         await Dispatch.findByIdAndDelete(dispatchId);
//       } else {
//         // Partially returned → update dispatch entry
//         await Dispatch.findByIdAndUpdate(dispatchId, {
//           dispatchedImeiIds: remainingImeiIds
//         });
//       }
//     } else {
//       // FULL RETURN if no imeiArray provided
//       await Imei.updateMany(
//         { _id: { $in: dispatchedImeiIds } },
//         { $set: { isDispatched: false } }
//       );
//       await Dispatch.findByIdAndDelete(dispatchId);
//       await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: false });
//     }

//     res.status(200).json({ message: "Bulk phone(s) returned successfully." });

//   } catch (error) {
//     console.error("Error returning bulk dispatch:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };
exports.returnBulkDispatch = async (req, res) => {
  try {
    const dispatchId = req.params.id;
    const { imeiArray = [] } = req.body;

    console.log("this is the imeiArray",imeiArray);
    

    const dispatchEntry = await Dispatch.findById(dispatchId);
    if (!dispatchEntry) {
      return res.status(404).json({ message: "Dispatch entry not found" });
    }

    const bulkPhonePurchaseId = dispatchEntry.bulkPhonePurchaseId;
    const dispatchedImeiIds = dispatchEntry.dispatchedImeiIds.map(id => id.toString());

    const allImeis = await Imei.find({ _id: { $in: dispatchedImeiIds } });

    let imeiIdsToReturn = [];

    if (imeiArray.length > 0) {
      const imei1List = imeiArray.map(item => item.imei1?.trim()).filter(Boolean);

      const filtered = allImeis.filter(i => imei1List.includes(i.imei1));
      imeiIdsToReturn = filtered.map(i => i._id.toString());

      console.log("IMEIs to return:", imeiIdsToReturn);
      console.log("Dispatched IMEIs:", dispatchedImeiIds);

      if (imeiIdsToReturn.length === 0) {
        return res.status(400).json({ message: "No matching IMEIs found to return." });
      }

      await Imei.updateMany(
        { _id: { $in: imeiIdsToReturn } },
        { $set: { isDispatched: false } }
      );

      const remainingImeiIds = dispatchedImeiIds.filter(id => !imeiIdsToReturn.includes(id));
      console.log("Remaining IMEIs after return:", remainingImeiIds);

      if (remainingImeiIds.length === 0) {
        // All returned
        await Dispatch.findByIdAndDelete(dispatchId);
        await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: false });
      } else {
        // Partial return
        await Dispatch.findByIdAndUpdate(dispatchId, {
          dispatchedImeiIds: remainingImeiIds,
        });
        await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: true });
      }

    } else {
      // FULL return
      await Imei.updateMany(
        { _id: { $in: dispatchedImeiIds } },
        { $set: { isDispatched: false } }
      );
      await Dispatch.findByIdAndDelete(dispatchId);
      await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, { dispatch: false });
    }

    res.status(200).json({ message: "Bulk phone(s) returned successfully." });

  } catch (error) {
    console.error("Error returning bulk dispatch:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};



exports.getSingleDispatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const dispatches = await Dispatch.find({
      userId,
      purchasePhoneId: { $ne: null },
    })
      .populate({
        path: 'purchasePhoneId',
        model: 'PurchasePhone',
      })
      .lean();

    res.status(200).json({ dispatches });
  } catch (error) {
    console.error('Error fetching single phone dispatches:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

exports.getBulkDispatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const dispatches = await Dispatch.find({
      userId,
      bulkPhonePurchaseId: { $ne: null },
    })
      .populate({
        path: 'bulkPhonePurchaseId',
        model: 'BulkPhonePurchase',
        populate: {
          path: 'ramSimDetails',
          model: 'RamSim',
          populate: {
            path: 'imeiNumbers',
            model: 'Imei',
          },
        },
      })
      .lean();

    const formattedDispatches = dispatches.map((dispatch) => {
      const ramSimDetails = (dispatch.bulkPhonePurchaseId?.ramSimDetails || [])
        .filter((ramSim) =>
          Array.isArray(ramSim.imeiNumbers) &&
          ramSim.imeiNumbers.some((imei) => imei?.isDispatched)
        )
        .map((ramSim) => ({
          companyName: ramSim.companyName,
          modelName: ramSim.modelName,
          ramMemory: ramSim.ramMemory,
          simOption: ramSim.simOption,
          priceOfOne: ramSim.priceOfOne,
          imeiNumbers: (ramSim.imeiNumbers || [])
            .filter((imei) => imei?.isDispatched)
            .map((imei) => ({
              _id: imei._id,
              imei1: imei.imei1,
              imei2: imei.imei2,
              isDispatched: imei.isDispatched,
            })),
        }));

      return {
        dispatchId: dispatch._id,
        receiverName: dispatch.receiverName,
        shopName: dispatch.shopName,
        dispatchDate: dispatch.dispatchDate,
        dispatchStatus: dispatch.status,
        bulkPhonePurchaseId: dispatch.bulkPhonePurchaseId?._id || null,
        dispatchedImeiIds: dispatch.dispatchedImeiIds || [],
        ramSimDetails,
      };
    });

    res.status(200).json({ dispatches: formattedDispatches });
  } catch (error) {
    console.error(
      'Error fetching and formatting bulk dispatches:',
      error.message,
      error.stack
    );
    res.status(500).json({ message: 'Internal server error', error });
  }
};


// exports.getBulkDispatches = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const dispatches = await Dispatch.find({
//       userId,
//       bulkPhonePurchaseId: { $ne: null },
//     })
//       .populate({
//         path: 'bulkPhonePurchaseId',
//         model: 'BulkPhonePurchase',
//         populate: {
//           path: 'ramSimDetails',
//           model: 'RamSim',
//           populate: {
//             path: 'imeiNumbers',
//             model: 'Imei',
//           },
//         },
//       })
//       .lean();

//     const formattedDispatches = dispatches.map(dispatch => {
//       const ramSimDetails = (dispatch.bulkPhonePurchaseId.ramSimDetails || [])
//         .filter(ramSim => ramSim.imeiNumbers.some(imei => imei.isDispatched))
//         .map(ramSim => ({
//           companyName: ramSim.companyName,
//           modelName: ramSim.modelName,
//           ramMemory: ramSim.ramMemory,
//           simOption: ramSim.simOption,
//           priceOfOne: ramSim.priceOfOne,
//           imeiNumbers: ramSim.imeiNumbers
//             .filter(imei => imei.isDispatched)
//             .map(imei => ({
//               _id: imei._id,
//               imei1: imei.imei1,
//               imei2: imei.imei2,
//               isDispatched: imei.isDispatched,
//             })),
//         }));

//       return {
//         dispatchId: dispatch._id,
//         receiverName: dispatch.receiverName,
//         shopName: dispatch.shopName,
//         dispatchDate: dispatch.dispatchDate,
//         dispatchStatus: dispatch.status,
//         bulkPhonePurchaseId: dispatch.bulkPhonePurchaseId._id,
//         dispatchedImeiIds: dispatch.dispatchedImeiIds,
//         ramSimDetails,
//       };
//     });

//     res.status(200).json({ dispatches: formattedDispatches });
//   } catch (error) {
//     console.error('Error fetching and formatting bulk dispatches:', error);
//     res.status(500).json({ message: 'Internal server error', error });
//   }
// };
exports.getCustomerSalesRecordDetailsByNumber = async (req, res) => {
  const { customerNumber } = req.params;
  const userId = req.user.id; // Extract user ID from request

  console.log("customerNumber:", customerNumber);
  console.log("userId:", userId);

  if (!customerNumber || !userId) {
    return res.status(400).json({ message: 'Customer number and user ID are required' });
  }

  try {
    const singleSoldPhone = await SingleSoldPhone.find({ customerNumber, userId });
    const singlePurchasePhone =  await PurchasePhone.find({mobileNumber:customerNumber,userId})
    // const soldPhones = await SoldPhone.find({ customerNumber, userId });

    const combinedResults = [
      ...singleSoldPhone.map(item => ({...item,type: "sold"})),
      ...singlePurchasePhone.map(item => ({...item,type:"purchase"}))
    ];

    if (combinedResults.length === 0) {
      return res.status(404).json({ message: 'No records found for this customer number' });
    }

    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};