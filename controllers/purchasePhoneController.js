const multer = require("multer");
const {
  Imei,
  RamSim,
  BulkPhonePurchase,
  PurchasePhone,
  SoldPhone,
  SingleSoldPhone,
  Dispatch,
} = require("../schema/purchasePhoneSchema");
const { default: mongoose } = require("mongoose");
const { invoiceGenerator } = require("../services/invoiceGenerator");
const PartyLedger = require("../schema/PartyLedgerSchema");
const {
  AddBankAccount,
  BankTransaction,
} = require("../schema/BankAccountSchema");
const {
  PocketCashSchema,
  PocketCashTransactionSchema,
} = require("../schema/PocketCashSchema");
const {
  AccessoryTransaction,
  Accessory,
} = require("../schema/accessorySchema");
const {
  Person,
  CreditTransaction,
} = require("../schema/PayablesAndReceiveablesSchema");

exports.addPurchasePhone = async (req, res) => {
  const {
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
    batteryHealth,
    color,
    imei1,
    imei2,
    mobileNumber,
    isApprovedFromEgadgets,
    paymentType,
    payableAmountLater,
    payableAmountNow,
    paymentDate,
    purchasePrice,
    finalPrice,
    demandPrice,
    warranty,
    shopid,
    bankAccountUsed,
    pocketCash,
    accountCash,
  } = req.body;

  try {
    console.log("This is name", name);
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
        accountCash: accountCash,
        accountType: bank.accountType,
      });
    }
    if (pocketCash) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (pocketCash > pocketTransaction.accountCash) {
        return res.status(400).json({ message: "Insufficient pocket cash" });
      }

      pocketTransaction.accountCash -= pocketCash;
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id, // if you want to associate it
        amountDeducted: pocketCash,
        accountCash: pocketTransaction.accountCash, // ✅ add this line
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `Purchase of mobile from company: ${companyName}, model: ${modelName}`,
        sourceOfAmountAddition: "Payment for purchase",
      });
    }
    if (paymentType === "credit") {
      console.log("====================================");
      console.log("Payment Type:", paymentType);
      console.log("Payable Amount Later:", payableAmountLater);
      console.log("Payable Amount Now:", payableAmountNow);
      console.log("Payment Date:", paymentDate);
      console.log("====================================");
      // Use Person and CreditTransaction for receivables

      // Find or create the person (customer) by name and number
      let person = await Person.findOne({
        name: name,
        number: imei1,
        userId: req.user.id,
      });

      if (!person) {
        person = await Person.create({
          userId: req.user.id,
          name: name,
          number: imei1,
          reference: "Phone Purchase",
          takingCredit: Number(payableAmountLater),
          status: "Payable",
        });
      } else {
        person.takingCredit =
          Number(person.takingCredit || 0) + Number(payableAmountLater);
        person.status = "Payable";
        person.reference = "Phone Purchase";
        await person.save();
      }

      // Log the credit transaction
      await CreditTransaction.create({
        userId: req.user.id,
        personId: person._id,
        givingCredit: Number(payableAmountLater),
        description: `Credit purchase of phone: ${companyName} ${modelName}`,
      });
    }
    // Save to database
    const savedPhone = await purchasePhone.save();
    res.status(201).json({
      message: "Purchase phone slip created successfully!",
      data: savedPhone,
    });
  } catch (error) {
    console.error("Error creating purchase phone slip:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      bankAccountUsed,
      pocketCash,
      accountCash,
      bankName,
      payableAmountNow,
      payableAmountLater,
      payableAmountLaterDate,
      exchangePhoneDetail,
    } = req.body;

    console.log("Received Data:", req.body);
    // Fetch the purchased phone details
    const purchasedPhone = await PurchasePhone.findById(purchasePhoneId);
    if (!purchasedPhone) {
      return res.status(404).json({ message: "Purchased phone not found" });
    }

    console.log("Purchased Phone Data:", purchasedPhone);
    console.log("PurchasedPhone:", purchasedPhone);
    console.log("Company Name:", purchasedPhone.companyName);
    // Ensure the phone is not already sold
    if (purchasedPhone.isSold) {
      return res.status(400).json({ message: "This phone is already sold" });
    }
    if (bankAccountUsed) {
      const bank = await AddBankAccount.findById(bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Deduct purchasePrice from accountCash
      bank.accountCash += Number(accountCash);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        sourceOfAmountAddition: `sale of mobile of company name: ${purchasedPhone.companyName} and model name: ${purchasedPhone.modelName}`,
        accountCash: accountCash,
        accountType: bank.accountType,
      });
    }
    if (pocketCash) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (pocketCash > pocketTransaction.accountCash) {
        return res.status(400).json({ message: "Insufficient pocket cash" });
      }

      pocketTransaction.accountCash += Number(pocketCash);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id, // if you want to associate it
        amountDeducted: pocketCash,
        accountCash: pocketTransaction.accountCash, // ✅ add this line
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `sale of mobile from company: ${purchasedPhone.companyName}, model: ${purchasedPhone.modelName}`,
        sourceOfAmountAddition: "Payment for mobile sale",
      });
    }

    // Set warranty based on condition
    const updatedWarranty =
      purchasedPhone.phoneCondition === "Used" ? warranty : "12 months";

    // Ensure user ID exists
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // **Validate conditional fields based on sellingPaymentType**
    if (sellingPaymentType === "Bank" && !bankName) {
      return res
        .status(400)
        .json({ message: "Bank Name is required for Bank payment type." });
    }
    if (
      sellingPaymentType === "Credit" &&
      (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)
    ) {
      return res.status(400).json({
        message: "All credit payment fields (Now, Later, Date) are required.",
      });
    }
    if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
      return res.status(400).json({
        message:
          "Exchange phone details are required for Exchange payment type.",
      });
    }
    console.log("accessories", accessories);
    if (accessories && accessories.length > 0) {
      for (const accessoryItem of accessories) {
        const accessory = await Accessory.findOne({
          _id: accessoryItem.name,
          userId: req.user.id,
        });

        if (!accessory) {
          return res.status(404).json({ message: "Accessory not found" });
        }

        if (Number(accessory.stock) < Number(accessoryItem.quantity)) {
          return res.status(400).json({ message: "Insufficient Inventory" });
        }

        const totalPrice =
          Number(accessoryItem.quantity) * Number(accessoryItem.price);

        await AccessoryTransaction.create({
          userId: req.user.id,
          accessoryId: accessoryItem.name,
          quantity: Number(accessoryItem.quantity),
          type: "sale",
          perPiecePrice: Number(accessoryItem.price),
          totalPrice,
        });

        accessory.stock -= Number(accessoryItem.quantity);
        accessory.totalPrice -=
          Number(accessory.perPiecePrice) * Number(accessoryItem.quantity);
        accessory.profit +=
          (Number(accessoryItem.price) - Number(accessory.perPiecePrice)) *
          Number(accessoryItem.quantity);
        await accessory.save();
      }
    }

    // Create a new sold phone entry
    const soldPhone = new SingleSoldPhone({
      purchasePhoneId,
      userId: req.user.id,
      shopid: purchasedPhone.shopid,
      customerName,
      customerNumber,
      saleDate,
      profit: Number(salePrice) - Number(purchasedPhone.price.purchasePrice),
      accessories: accessories,
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
      payableAmountNow:
        sellingPaymentType === "Credit" ? payableAmountNow : undefined,
      payableAmountLater:
        sellingPaymentType === "Credit" ? payableAmountLater : undefined,
      payableAmountLaterDate:
        sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
      exchangePhoneDetail:
        sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
      invoiceNumber: "INV-" + new Date().getTime(),
    });
    // Handle payables/receivables if sellingPaymentType is "Credit"
    if (sellingPaymentType === "Credit") {
      // Use Person and CreditTransaction for receivables

      // Find or create the person (customer) by name and number
      let person = await Person.findOne({
        name: customerName,
        number: customerNumber,
        userId: req.user.id,
      });

      if (!person) {
        person = await Person.create({
          userId: req.user.id,
          name: customerName,
          number: customerNumber,
          reference: "Phone Sale",
          givingCredit: Number(payableAmountLater),
          status: "Receivable",
        });
      } else {
        person.givingCredit =
          Number(person.givingCredit || 0) + Number(payableAmountLater);
        person.status = "Receivable";
        await person.save();
      }

      // Log the credit transaction
      await CreditTransaction.create({
        userId: req.user.id,
        personId: person._id,
        givingCredit: Number(payableAmountLater),
        description: `Credit sale of phone: ${purchasedPhone.companyName} ${purchasedPhone.modelName}`,
      });
    }
    // Validate the object before saving
    const validationError = soldPhone.validateSync();
    if (validationError) {
      console.error("Validation Error:", validationError);
      return res
        .status(400)
        .json({ message: "Validation failed", error: validationError });
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
    const soldPhones = await SingleSoldPhone.find({ userId: req.user.id })
      .populate("userId", "name email") // Populate user details (optional)
      .populate({
        path: "purchasePhoneId",
        model: "PurchasePhone", // Explicitly specify the model
        select: "companyName modelName imei1 imei2 profit", // Select required fields
      }); // If needed, get original phone details

    if (!soldPhones || soldPhones.length === 0) {
      return res.status(404).json({ message: "No sold phones found" });
    }

    res.status(200).json({ success: true, soldPhones });
  } catch (error) {
    console.error("Error fetching sold phones:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    if (!req.user.id || !req.user) {
      return res.status(404).json({ message: "Authenticate please" });
    }
    res.status(200).json({ success: true, soldPhoneDetail });
  } catch (error) {
    console.error("Error getting sold phone detail:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// get bulk sold phone by id
exports.getBulkSoldPhoneById = async (req, res) => {
  const { id } = req.params;
  try {
    const soldPhoneDetail = await SoldPhone.findById(id);
    if (!soldPhoneDetail) {
      return res.status(404).json({ message: "Sold phone not found" });
    }
    if (!req.user.id || !req.user) {
      return res.status(404).json({ message: "Authenticate please" });
    }
    res.status(200).json({ success: true, soldPhoneDetail });
  } catch (error) {
    console.error("Error getting detail:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all purchase phone slips or filtered results
exports.getPurchasePhoneByFilter = async (req, res) => {
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

    if (name) filters.name = new RegExp(name, "i"); // Case-insensitive search
    if (cnic) filters.cnic = cnic;
    if (modelName) filters.modelName = new RegExp(modelName, "i"); // Case-insensitive search
    if (phoneCondition) filters.phoneCondition = phoneCondition;
    if (specifications) filters.specifications = specifications;
    if (isApprovedFromEgadgets)
      filters.isApprovedFromEgadgets = isApprovedFromEgadgets === "true"; // Convert to boolean
    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom); // Greater than or equal to
      if (dateTo) filters.date.$lte = new Date(dateTo); // Less than or equal to
    }

    // Query the database with filters
    const purchasePhones = await PurchasePhone.find(filters);

    // Respond with the results
    res.status(200).json({
      message: "Purchase phone slips retrieved successfully!",
      data: purchasePhones,
    });
  } catch (error) {
    console.error("Error fetching purchase phone slips:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.getAllPurchasePhone = async (req, res) => {
  try {
    // Fetch all purchase phone slips for the logged-in user
    const purchasePhones = await PurchasePhone.find({
      userId: req.user.id,
    }).populate("soldDetails");

    // Format the response to match the required structure
    const formattedPhones = purchasePhones.map((phone) => ({
      name: phone.name,
      _id: phone._id,
      images: phone.images || [],
      cnic: phone.cnic,
      modelName: phone.modelName,
      dispatch: phone.dispatch,
      batteryHealth: phone.batteryHealth || "",
      ramMemory: phone.ramMemory,
      mobileNumber: phone.mobileNumber,
      date: phone.date,
      price: {
        purchasePrice: phone.price.purchasePrice,
        finalPrice: phone.price.finalPrice,
        demandPrice: phone.price.demandPrice,
      },
      // accessories: [
      //   phone.accessories?.box ? "box" : null,
      //   phone.accessories?.charger ? "charger" : null,
      //   phone.accessories?.handFree ? "handFree" : null,
      // ].filter(Boolean),
      accessories: {
        box: phone.accessories.box,
        charger: phone.accessories.charger,
        handfree: phone.accessories.handFree,
      },
      // Ensure images field exists
      companyName: phone.companyName,
      specifications: phone.specifications,
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
      isSold: phone.isSold,
      warranty: phone.warranty,
      __v: phone.__v,
    }));

    res.status(200).json({
      message: "Phones retrieved successfully!",
      phones: formattedPhones,
    });
  } catch (error) {
    console.error("Error fetching all purchase phone slips:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getAllPurchasePhones = async (req, res) => {
  try {
    // Fetch all single purchase phones
    const purchasePhones = await PurchasePhone.find({
      userId: req.user.id,
    }).populate("soldDetails");
    console.log("Tis is userIdd", req.user.id);
    // Fetch all bulk purchased phones with RAM and IMEI details
    const bulkPhones = await BulkPhonePurchase.find({
      userId: req.user.id,
    }).populate({
      path: "ramSimDetails",
      populate: { path: "imeiNumbers" },
    });

    // Calculate total quantity of mobiles from bulk phones
    const bulkPhonesWithQuantity = bulkPhones.map((bulkPhone) => {
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
        bulkPhones: bulkPhonesWithQuantity,
      },
    });
  } catch (error) {
    console.error("Error fetching all purchase phone slips:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get a specific purchase phone slip by ID
exports.getPurchasePhoneById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the document by ID
    const purchasePhone = await PurchasePhone.findById(id);

    if (!purchasePhone) {
      return res.status(404).json({ message: "Purchase phone slip not found" });
    }

    res.status(200).json({
      message: "Purchase phone slip retrieved successfully!",
      data: purchasePhone,
    });
  } catch (error) {
    console.error("Error fetching purchase phone slip by ID:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Edit Purchase Phone Slip
// exports.updateSinglePurchasePhone = async (req, res) => {
//   console.log("Received data:", req.body)
//     try{
//       const {id} =  req.params;
//       const updateData = req.body;

//       const existingPhone = await PurchasePhone.findById(id);
//       if(!existingPhone) return res.status(404).json({message: "Phone not found"})
//         const updatedPhone = await PurchasePhone.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
//         if (!updatedPhone) {
//           return res.status(404).json({ message: "Purchase phone slip not found" });
//         }
//       res.status(200).json({message: "Purchase Phone updated successfully", data: updatedPhone})
//     }catch(error){
//       console.error("Error updating purchase phone:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
// };
exports.updateSinglePurchasePhone = async (req, res) => {
  console.log("Received data:", req.body);
  try {
    const { id } = req.params;
    const { purchasePrice, finalPrice, demandPrice, ...restData } = req.body;

    // Convert string prices to numbers
    const price = {
      purchasePrice: Number(purchasePrice),
      finalPrice: finalPrice ? Number(finalPrice) : undefined,
      demandPrice: demandPrice ? Number(demandPrice) : undefined,
    };

    // Prepare update object with nested price
    const updateData = {
      ...restData,
      price,
    };

    const existingPhone = await PurchasePhone.findById(id);
    if (!existingPhone) {
      return res.status(404).json({ message: "Phone not found" });
    }

    const updatedPhone = await PurchasePhone.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPhone) {
      return res.status(404).json({ message: "Purchase phone slip not found" });
    }

    res.status(200).json({
      message: "Purchase Phone updated successfully",
      data: updatedPhone,
    });
  } catch (error) {
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
      return res.status(404).json({ message: "Purchase phone slip not found" });
    }

    // Check if the user is authorized (e.g., only the user who added it or an admin)
    if (deletedPhone.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this purchase phone slip" });
    }

    // Delete the document
    await PurchasePhone.findByIdAndDelete(id);

    res.status(200).json({
      message: "Purchase phone slip deleted successfully!",
      data: deletedPhone,
    });
  } catch (error) {
    console.error("Error deleting purchase phone slip:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      // partyName,
      date,
      companyName,
      modelName,
      ramSimDetails,
      bankAccountUsed,
      amountFromPocket,
      amountFromBank,
      prices,
      purchasePaymentStatus,
      purchasePaymentType,
      creditPaymentData = {},
      entityData = {},
    } = req.body;
    let person;
    console.log("Received Data:", req.body);

    person = await Person.findOne({
      ...(!entityData.number && { _id: entityData._id }),
      // name: personData,
      ...(entityData.number && { number: entityData.number }),
      userId: req.user.id,
    });
    const takingCredit = person.takingCredit;
    if (purchasePaymentType === "credit") {
      console.log("entityData", person);
      if (!person) {
        person = await Person.create({
          userId: req.user.id,
          name: entityData.name,
          number: entityData.number,
          reference: "Bulk Category Purchase",
          takingCredit: Number(creditPaymentData.payableAmountLater),
          status: "Payable",
        });
      } else {
        person.takingCredit =
          Number(person.takingCredit || 0) +
          Number(creditPaymentData.payableAmountLater);
        person.status = "Payable";

        Number(creditPaymentData.payableAmountLater);
        person.reference = "Bulk Category Purchase";
        await person.save();
      }
      // Log the credit transaction
      await CreditTransaction.create({
        userId: req.user.id,
        personId: person._id,
        balanceAmount:
          Number(takingCredit) + Number(creditPaymentData.payableAmountLater),
        takingCredit: Number(creditPaymentData.payableAmountLater),
        description: `Credit purchase of Bulk Category of bulk category purchase by ${entityData.name}`,
      });
    }
    if (purchasePaymentType === "full-payment") {
      if (!person) {
        const newPerson = await Person.create({
          userId: req.user.id,
          name: entityData.name,
          number: entityData.number,
          reference: "bulk category Purchase",
          takingCredit: 0,
          status: "Settled",
        });
        await CreditTransaction.create({
          userId: req.user.id,
          personId: newPerson._id,
          takingCredit: 0,
          balanceAmount: 0,
          description: `full payment of bulk category purchase by ${
            entityData.name || newPerson.name
          } for ${modelName} of per piece price ${
            prices.buyingPrice
          } and total amount ${prices.buyingPrice}`,
        });
      } else {
        await CreditTransaction.create({
          userId: req.user.id,
          personId: person._id,
          takingCredit: 0,
          balanceAmount: Number(person.takingCredit),
          description: `full payment of bulk category purchase by ${
            entityData.name || person.name
          } for ${modelName} of per piece price ${
            prices.buyingPrice
          } and total amount ${prices.buyingPrice}`,
        });
      }
    }

    // if (purchasePaymentType === "credit") {
    //   const total =
    //     Number(creditPaymentData.payableAmountNow) +
    //     Number(creditPaymentData.payableAmountLater);
    //   if (total !== Number(prices.buyingPrice)) {
    //     return res.status(400).json({
    //       message: "Invalid data: payable amount should equal buying price",
    //     });
    //   }
    // }

    if (!ramSimDetails || !Array.isArray(ramSimDetails)) {
      return res
        .status(400)
        .json({ message: "Invalid data: ramSimDetails must be an array" });
    }

    // const party = await PartyLedger.findOne({ partyName }).select("_id").exec();
    // if (!party)
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Party not found" });

    const bulkPhonePurchase = new BulkPhonePurchase({
      // partyLedgerId: party._id,
      userId: req.user.id,
      // partyName,
      date,
      companyName,
      ...(entityData._id || person?._id
        ? { personId: entityData._id || person._id }
        : {}),
      modelName,
      prices,
      purchasePaymentType,
      purchasePaymentStatus,
      ...(purchasePaymentType === "credit" && { creditPaymentData }),
    });
    if (bankAccountUsed) {
      const bank = await AddBankAccount.findById(bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Deduct purchasePrice from accountCash
      bank.accountCash -= Number(amountFromBank);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        reasonOfAmountDeduction: `Purchase of bulk mobie`,
        accountCash: Number(amountFromBank),
        accountType: bank.accountType,
      });
    }
    if (amountFromPocket) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      if (amountFromPocket > pocketTransaction.accountCash) {
        return res.status(400).json({ message: "Insufficient pocket cash" });
      }

      pocketTransaction.accountCash -= Number(amountFromPocket);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id, // if you want to associate it
        amountDeducted: amountFromPocket,
        accountCash: pocketTransaction.accountCash, // ✅ add this line
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `Purchase of bulk mobile`,
        sourceOfAmountAddition: "Payment for purchase",
      });
    }
    if (purchasePaymentType === "credit") {
      const totalPaid =
        (Number(creditPaymentData.totalPaidAmount) || 0) +
        Number(creditPaymentData.payableAmountNow || 0);
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
    res.status(500).json({
      message: "Error creating Bulk Phone Purchase",
      error: error.message,
    });
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
      message: "BulkPhonePurchase updated successfully",
      data: updatedBulkPurchase,
    });
  } catch (error) {
    console.error("Error updating BulkPhonePurchase:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all Bulk Phone Purchases
// router.get("/bulk-phone-purchase",
exports.getBulkPhone = async (req, res) => {
  try {
    const bulkPhonePurchases = await BulkPhonePurchase.find({
      userId: req.user.id,
    })
      .populate({
        path: "ramSimDetails",
        model: "RamSim",
        populate: {
          path: "imeiNumbers",
          model: "Imei",
        },
      })
      .populate("personId", "name number") // Populate person details
      .sort({ date: -1 }) // Sort by date, most recent first
      .lean();

    const updatedPurchases = bulkPhonePurchases.map((purchase) => {
      const creditAmount = Number(
        purchase?.creditPaymentData?.payableAmountLater || 0
      );
      const buyingPrice = Number(purchase?.prices?.buyingPrice || 0);

      const actualBuyingPrice = Math.round(
        creditAmount > 0 ? buyingPrice + creditAmount : buyingPrice
      );

      return {
        ...purchase,
        dispatch: purchase.dispatch ?? false,
        actualBuyingPrice,
      };
    });

    res.status(200).json(updatedPurchases); // ✅ Don't wrap in `{}` — it’s already an array
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Error fetching Bulk Phone Purchases",
      error: error.message,
    });
  }
};

// Get Bulk Phone Purchase by ID
// router.get("/bulk-phone-purchase/:id",
exports.getBulkPhoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const bulkPhonePurchase = await BulkPhonePurchase.findById(id).populate({
      path: "ramSimDetails",
      populate: { path: "imeiNumbers" },
    });
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk Phone Purchase not found" });
    }
    res.status(200).json(bulkPhonePurchase);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Bulk Phone Purchase",
      error: error.message,
    });
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

    res.status(200).json({
      message: "Bulk Phone Purchase updated successfully",
      data: updatedBulkPhonePurchase,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating Bulk Phone Purchase",
      error: error.message,
    });
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
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this bulk phone purchase" });
    }

    // Delete related RamSim and Imei records
    const ramSimIds = bulkPhonePurchase.ramSimDetails; // Array of RamSim IDs
    if (ramSimIds.length > 0) {
      await Imei.deleteMany({ ramSimId: { $in: ramSimIds } }); // Delete IMEIs linked to RamSims
      await RamSim.deleteMany({ _id: { $in: ramSimIds } }); // Delete RamSim records
    }

    // Delete the bulkPhonePurchase document
    await BulkPhonePurchase.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Bulk Phone Purchase deleted successfully" });
  } catch (error) {
    console.error("Error deleting Bulk Phone Purchase:", error);
    res.status(500).json({
      message: "Error deleting Bulk Phone Purchase",
      error: error.message,
    });
  }
};

// exports.sellPhonesFromBulk = async (req, res) => {
//   try {
//     const {
//       bankAccountUsed,
//       pocketCash,
//       accountCash,
//       bulkPhonePurchaseId,
//       imeiNumbers,
//       salePrice,
//       totalInvoice,
//       warranty,
//       customerName,
//       cnicBackPic,
//       dateSold,
//       customerNumber,
//       cnicFrontPic,
//       accessories,
//       sellingPaymentType,
//       bankName,
//       payableAmountNow,
//       payableAmountLater,
//       payableAmountLaterDate,
//       exchangePhoneDetail,
//     } = req.body;
//     console.log(bankAccountUsed, pocketCash, accountCash);

//     if (!salePrice || !warranty) {
//       return res
//         .status(400)
//         .json({ message: "Sale price and warranty are required" });
//     }

//     // Find the bulk phone purchase
//     const bulkPhonePurchase = await BulkPhonePurchase.findById(
//       bulkPhonePurchaseId
//     ).populate({
//       path: "ramSimDetails",
//       populate: {
//         path: "imeiNumbers",
//       },
//     });

//     if (!bulkPhonePurchase) {
//       return res.status(404).json({ message: "Bulk phone purchase not found" });
//     }

//     const soldPhones = [];

//     for (const imei of imeiNumbers) {
//       const ramSim = bulkPhonePurchase.ramSimDetails.find((ramSim) =>
//         ramSim.imeiNumbers.some(
//           (imeiRecord) => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei
//         )
//       );

//       if (!ramSim) {
//         return res.status(404).json({
//           message: `Phone with IMEI ${imei} not found in this bulk purchase`,
//         });
//       }

//       const imeiRecord = ramSim.imeiNumbers.find(
//         (imeiRecord) => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei
//       );
//       if (sellingPaymentType === "Bank" && !bankName) {
//         return res
//           .status(400)
//           .json({ message: "Bank Name is required for Bank payment type." });
//       }
//       if (
//         sellingPaymentType === "Credit" &&
//         (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)
//       ) {
//         return res.status(400).json({
//           message: "All credit payment fields (Now, Later, Date) are required.",
//         });
//       }
//       if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
//         return res.status(400).json({
//           message:
//             "Exchange phone details are required for Exchange payment type.",
//         });
//       }

//       console.log("THis is bulk phone purchase id", bulkPhonePurchaseId);
//       // Create a new SoldPhone record
//       const soldPhone = new SoldPhone({
//         bulkPhonePurchaseId,
//         imei1: imeiRecord.imei1,
//         imei2: imeiRecord.imei2 || null,
//         salePrice,
//         totalInvoice,
//         accessories,
//         customerName,
//         profit:
//           Number(salePrice) - Number(bulkPhonePurchase.prices.buyingPrice),
//         customerNumber,
//         purchasePrice: bulkPhonePurchase.prices.buyingPrice,
//         dateSold,
//         cnicBackPic,
//         cnicFrontPic,
//         sellingPaymentType,
//         warranty,
//         userId: req.user.id,
//         invoiceNumber: invoiceGenerator(),
//         bankName: sellingPaymentType === "Bank" ? bankName : undefined,
//         payableAmountNow:
//           sellingPaymentType === "Credit" ? payableAmountNow : undefined,
//         payableAmountLater:
//           sellingPaymentType === "Credit" ? payableAmountLater : undefined,
//         payableAmountLaterDate:
//           sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
//         exchangePhoneDetail:
//           sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
//       });

//       await soldPhone.save();
//       soldPhones.push(soldPhone);

//       // Remove IMEI from `Imei` collection
//       await Imei.findByIdAndDelete(imeiRecord._id);

//       // Update `ramSimDetails`
//       ramSim.imeiNumbers = ramSim.imeiNumbers.filter(
//         (record) => record._id.toString() !== imeiRecord._id.toString()
//       );
//       await ramSim.save();
//     }
//     console.log(
//       "check for bank and pocket cash",
//       bankAccountUsed,
//       pocketCash,
//       accountCash
//     );

//     if (bankAccountUsed) {
//       const bank = await AddBankAccount.findById(bankAccountUsed);
//       if (!bank) return res.status(404).json({ message: "Bank not found" });

//       // Deduct purchasePrice from accountCash
//       bank.accountCash += Number(accountCash);
//       await bank.save();

//       // Log the transaction
//       await BankTransaction.create({
//         bankId: bank._id,
//         userId: req.user.id,
//         sourceOfAmountAddition: `sale of bulk mobile ${imeiNumbers.length} number to customer: ${customerName}`,
//         accountCash: accountCash,
//         accountType: bank.accountType,
//       });
//     }
//     if (pocketCash) {
//       const pocketTransaction = await PocketCashSchema.findOne({
//         userId: req.user.id,
//       });
//       if (!pocketTransaction) {
//         return res
//           .status(404)
//           .json({ message: "Pocket cash account not found." });
//       }

//       if (pocketCash > pocketTransaction.accountCash) {
//         return res.status(400).json({ message: "Insufficient pocket cash" });
//       }

//       pocketTransaction.accountCash += Number(pocketCash);
//       await pocketTransaction.save();

//       await PocketCashTransactionSchema.create({
//         userId: req.user.id,
//         pocketCashId: pocketTransaction._id, // if you want to associate it
//         amountDeducted: pocketCash,
//         accountCash: pocketTransaction.accountCash, // ✅ add this line
//         remainingAmount: pocketTransaction.accountCash,
//         sourceOfAmountAddition: `Sale of bulk mobile ${imeiNumbers.length} number to customer: ${customerName}`,
//       });
//     }
//     if (accessories && accessories.length > 0) {
//       for (const accessoryItem of accessories) {
//         const accessory = await Accessory.findOne({
//           _id: accessoryItem.name,
//           userId: req.user.id,
//         });

//         if (!accessory) {
//           return res.status(404).json({ message: "Accessory not found" });
//         }

//         if (Number(accessory.stock) < Number(accessoryItem.quantity)) {
//           return res.status(400).json({ message: "Insufficient Inventory" });
//         }

//         const totalPrice =
//           Number(accessoryItem.quantity) * Number(accessoryItem.price);

//         await AccessoryTransaction.create({
//           userId: req.user.id,
//           accessoryId: accessoryItem.name,
//           quantity: Number(accessoryItem.quantity),
//           perPiecePrice: Number(accessoryItem.price),
//           totalPrice,
//         });

//         accessory.stock -= Number(accessoryItem.quantity);
//         accessory.totalPrice -=
//           Number(accessory.perPiecePrice) * Number(quantity);
//         accessory.profit +=
//           (Number(accessoryItem.price) - Number(accessory.perPiecePrice)) *
//           Number(accessoryItem.quantity);
//         await accessory.save();
//       }
//     }
//     // Reload the bulk purchase to ensure updates are reflected
//     const updatedBulkPhonePurchase = await BulkPhonePurchase.findById(
//       bulkPhonePurchaseId
//     ).populate("ramSimDetails");

//     // If no phones are left, delete the bulk purchase safely
//     if (
//       !updatedBulkPhonePurchase ||
//       updatedBulkPhonePurchase.ramSimDetails.every(
//         (ramSim) => ramSim.imeiNumbers.length === 0
//       )
//     ) {
//       await BulkPhonePurchase.findByIdAndDelete(bulkPhonePurchaseId);
//       return res.status(200).json({
//         message: "All phones sold. Bulk purchase deleted.",
//         soldPhones,
//       });
//     }

//     res.status(200).json({
//       message: "Phones sold successfully",
//       soldPhones,
//       statusUpdated: "Partial sale completed",
//     });
//   } catch (error) {
//     console.error("Error selling phones:", error);
//     res
//       .status(500)
//       .json({ message: "Error selling phones", error: error.message });
//   }
// };
exports.sellPhonesFromBulk = async (req, res) => {
  try {
    const {
      entityData,
      bankAccountUsed,
      pocketCash,
      accountCash,
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
      exchangePhoneDetail,
    } = req.body;

    // Validation
    if (!salePrice || !warranty) {
      return res
        .status(400)
        .json({ message: "Sale price and warranty are required" });
    }

    if (
      !imeiNumbers ||
      !Array.isArray(imeiNumbers) ||
      imeiNumbers.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one IMEI must be provided" });
    }

    // Find the bulk phone purchase
    const bulkPhonePurchase = await BulkPhonePurchase.findById(
      bulkPhonePurchaseId
    ).populate({
      path: "ramSimDetails",
      populate: {
        path: "imeiNumbers",
      },
    });

    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk phone purchase not found" });
    }

    // Validate payment type specific fields
    if (sellingPaymentType === "Bank" && !bankName) {
      return res
        .status(400)
        .json({ message: "Bank Name is required for Bank payment type." });
    }
    if (
      sellingPaymentType === "Credit" &&
      (!payableAmountNow || !payableAmountLater || !payableAmountLaterDate)
    ) {
      return res.status(400).json({
        message: "All credit payment fields (Now, Later, Date) are required.",
      });
    }
    if (sellingPaymentType === "Exchange" && !exchangePhoneDetail) {
      return res.status(400).json({
        message:
          "Exchange phone details are required for Exchange payment type.",
      });
    }
    console.log("check for entityData", entityData);

    let person = null;
    if (entityData._id || entityData.number) {
      person = await Person.findOne({
        ...(!entityData.number && entityData._id && { _id: entityData._id }),
        ...(entityData.number && { number: entityData.number }),
        userId: req.user.id,
      });
    }
    console.log("person found:", person);
    if (sellingPaymentType === "Credit") {
      if (!person) {
        person = await Person.create({
          userId: req.user.id,
          name: entityData.name,
          number: entityData.number,
          reference: "bulk category Sale",
          givingCredit: Number(payableAmountLater),
          status: "Receivable",
        });
      } else {
        person.givingCredit += Number(payableAmountLater);
        person.status = "Receivable";
        await person.save();
      }

      await CreditTransaction.create({
        userId: req.user.id,
        personId: person._id,
        givingCredit: Number(payableAmountLater),
        balanceAmount: Number(person.givingCredit) + Number(payableAmountLater),
        description: `Credit Sale: ${imeiNumbers.length} phones sold to ${
          entityData.name || person.name
        } || Credit: ${payableAmountLater}`,
      });
    }

    if (sellingPaymentType === "Full Payment") {
      if (!person) {
        const newPerson = await Person.create({
          userId: req.user.id,
          name: entityData.name,
          number: entityData.number,
          reference: "bulk category Sale",
          givingCredit: 0,
          status: "Settled",
        });
        await newPerson.save();
        await CreditTransaction.create({
          userId: req.user.id,
          personId: newPerson._id,
          givingCredit: 0,
          balanceAmount: 0,
          description: `Complete Payment of bulk category Sale:  ${
            imeiNumbers.length
          } phones sold to ${entityData.name || person.name} `,
        });
      } else if (person) {
        await CreditTransaction.create({
          userId: req.user.id,
          personId: person._id,
          balanceAmount: Number(person.givingCredit),
          givingCredit: 0,
          description: `Complete Payment of bulk category Sale:  ${
            imeiNumbers.length
          } phones sold to ${entityData.name || person.name}  `,
        });
      } else {
        console.log("no required entityData for full payment sale");
      }
    }

    // Collect all IMEI records being sold
    const imeiRecords = [];
    const imei1List = [];
    const imei2List = [];

    for (const imei of imeiNumbers) {
      const ramSim = bulkPhonePurchase.ramSimDetails.find((ramSim) =>
        ramSim.imeiNumbers.some(
          (imeiRecord) => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei
        )
      );

      if (!ramSim) {
        return res.status(404).json({
          message: `Phone with IMEI ${imei} not found in this bulk purchase`,
        });
      }

      const imeiRecord = ramSim.imeiNumbers.find(
        (imeiRecord) => imeiRecord.imei1 === imei || imeiRecord.imei2 === imei
      );

      imeiRecords.push(imeiRecord);
      if (imeiRecord.imei1) imei1List.push(imeiRecord.imei1);
      if (imeiRecord.imei2) imei2List.push(imeiRecord.imei2);
    }
    // Calculate total buying price for the sold IMEIs
    let totalBuyingPrice = 0;
    for (const imeiRecord of imeiRecords) {
      // Find the ramSim that contains this IMEI
      const ramSim = bulkPhonePurchase.ramSimDetails.find((rs) =>
        rs.imeiNumbers.some(
          (ir) => ir._id.toString() === imeiRecord._id.toString()
        )
      );
      if (ramSim && ramSim.priceOfOne) {
        totalBuyingPrice += Number(ramSim.priceOfOne);
      } else if (
        bulkPhonePurchase.prices &&
        bulkPhonePurchase.prices.buyingPrice
      ) {
        // fallback to overall bulk buying price (divided by total IMEIs if needed)
        totalBuyingPrice +=
          Number(bulkPhonePurchase.prices.buyingPrice) /
          (bulkPhonePurchase.ramSimDetails.reduce(
            (sum, rs) => sum + (rs.imeiNumbers ? rs.imeiNumbers.length : 0),
            0
          ) || 1);
      }
    }

    // Calculate total profit
    const totalProfit = Number(salePrice) - totalBuyingPrice;
    // )
    // *
    //  imeiNumbers.length;

    // Create a single SoldPhone record for all IMEIs
    const soldPhone = new SoldPhone({
      bulkPhonePurchaseId,
      imei1: imei1List, // Array of all IMEI1s
      imei2: imei2List.length > 0 ? imei2List : null, // Array of all IMEI2s or null
      salePrice,
      totalInvoice,
      accessories,
      customerName,
      profit: totalProfit,
      customerNumber,
      purchasePrice: bulkPhonePurchase.prices.buyingPrice,
      dateSold,
      cnicBackPic,
      cnicFrontPic,
      sellingPaymentType,
      warranty,
      userId: req.user.id,
      invoiceNumber: invoiceGenerator(),
      bankName: sellingPaymentType === "Bank" ? bankName : undefined,
      payableAmountNow:
        sellingPaymentType === "Credit" ? payableAmountNow : undefined,
      payableAmountLater:
        sellingPaymentType === "Credit" ? payableAmountLater : undefined,
      payableAmountLaterDate:
        sellingPaymentType === "Credit" ? payableAmountLaterDate : undefined,
      exchangePhoneDetail:
        sellingPaymentType === "Exchange" ? exchangePhoneDetail : undefined,
      bankAccountUsed: bankAccountUsed || undefined,
    });

    await soldPhone.save();

    // Remove all sold IMEIs from the system
    for (const imeiRecord of imeiRecords) {
      await Imei.findByIdAndDelete(imeiRecord._id);

      // Update ramSimDetails by removing the sold IMEI
      const ramSim = bulkPhonePurchase.ramSimDetails.find((rs) =>
        rs.imeiNumbers.some(
          (ir) => ir._id.toString() === imeiRecord._id.toString()
        )
      );

      if (ramSim) {
        ramSim.imeiNumbers = ramSim.imeiNumbers.filter(
          (record) => record._id.toString() !== imeiRecord._id.toString()
        );
        await ramSim.save();
      }
    }

    // Handle bank transaction if applicable
    if (bankAccountUsed) {
      const bank = await AddBankAccount.findById(bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      bank.accountCash += Number(accountCash);
      await bank.save();

      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        sourceOfAmountAddition: `Sale of ${imeiNumbers.length} phones to ${customerName}`,
        accountCash: accountCash,
        accountType: bank.accountType,
      });
    }
    console.log("check for userId", req.user.id);
    // Handle pocket cash transaction if applicable
    if (pocketCash) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      pocketTransaction.accountCash += Number(pocketCash);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id,
        amountDeducted: pocketCash,
        accountCash: pocketTransaction.accountCash,
        remainingAmount: pocketTransaction.accountCash,
        sourceOfAmountAddition: `Sale of ${imeiNumbers.length} phones to ${customerName}`,
      });
    }

    // Handle accessories if applicable
    if (accessories && accessories.length > 0) {
      for (const accessoryItem of accessories) {
        const accessory = await Accessory.findOne({
          _id: accessoryItem.name,
          userId: req.user.id,
        });

        if (!accessory) {
          return res.status(404).json({ message: "Accessory not found" });
        }

        if (Number(accessory.stock) < Number(accessoryItem.quantity)) {
          return res.status(400).json({ message: "Insufficient Inventory" });
        }

        const totalPrice =
          Number(accessoryItem.quantity) * Number(accessoryItem.price);

        await AccessoryTransaction.create({
          userId: req.user.id,
          type: "sale",
          accessoryId: accessoryItem.name,
          quantity: Number(accessoryItem.quantity),
          perPiecePrice: Number(accessoryItem.price),
          totalPrice,
        });

        accessory.stock -= Number(accessoryItem.quantity);
        accessory.totalPrice -= totalPrice;
        accessory.profit +=
          (Number(accessoryItem.price) - Number(accessory.perPiecePrice)) *
          Number(accessoryItem.quantity);
        await accessory.save();
      }
    }

    // Check if bulk purchase should be deleted (all phones sold)
    const updatedBulkPhonePurchase = await BulkPhonePurchase.findById(
      bulkPhonePurchaseId
    ).populate("ramSimDetails");

    if (
      updatedBulkPhonePurchase.ramSimDetails.every(
        (ramSim) => ramSim.imeiNumbers.length === 0
      )
    ) {
      await BulkPhonePurchase.findByIdAndDelete(bulkPhonePurchaseId);
      return res.status(200).json({
        message: "All phones sold. Bulk purchase deleted.",
        soldPhone, // Return the single sold phone document
      });
    }

    res.status(200).json({
      message: "Phones sold successfully",
      soldPhone, // Return the single sold phone document
      statusUpdated: "Partial sale completed",
    });
  } catch (error) {
    console.error("Error selling phones:", error);
    res
      .status(500)
      .json({ message: "Error selling phones", error: error.message });
  }
};
// Get all sales (both single and bulk)
// exports.getAllSales = async (req, res) => {
//   try {
//     const allSales = await SoldPhone.find({ userId: req.user.id })
//       .populate({
//         path: 'bulkPhonePurchaseId',
//         // Populate all necessary fields from bulk purchase
//         select: 'companyName modelName partyName date prices ramSimDetails partyLedgerId purchasePaymentStatus purchasePaymentType creditPaymentData',
//         // Also populate the ramSimDetails if needed
//         populate: {
//           path: 'ramSimDetails',
//           select: 'ramMemory simOption priceOfOne imeiNumbers',
//           populate: {
//             path: 'imeiNumbers',
//             select: 'imei1 imei2 batteryHealth color'
//           }
//         }
//       })

//       .sort({ dateSold: -1 }); // Sort by most recent sales first

//     const responseData = allSales.map((sale) => {
//       const saleObj = sale.toObject();

//       if (sale.bulkPhonePurchaseId) {
//         // Calculate purchase price from bulk data
//         const purchasePrice = sale.bulkPhonePurchaseId.ramSimDetails?.find(ramSim =>
//           ramSim.imeiNumbers.some(imei =>
//             imei.imei1 === sale.imei1 || imei.imei2 === sale.imei1
//           )
//         )?.priceOfOne;

//         return {
//           ...saleObj,
//           type: "Bulk Phone",
//           buyingPrice: sale.bulkPhonePurchaseId.prices?.buyingPrice || null,
//           salePrice: sale.salePrice,
//           sellingPaymentType: sale.sellingPaymentType,
//           warranty: sale.warranty,
//           dateSold: sale.dateSold
//         };
//       } else if (sale.purchasePhoneId) {
//         return {
//           ...saleObj,
//           type: "Single Phone",
//           purchaseDetails: sale.purchasePhoneId
//         };
//       }
//       return saleObj;
//     });

//     res.status(200).json({
//       message: "Sales retrieved successfully!",
//       data: responseData,
//     });
//   } catch (error) {
//     console.error("Error fetching sales:", error);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
exports.getAllSales = async (req, res) => {
  try {
    const bulkSales = await SoldPhone.find({
      userId: req.user.id,
    })
      .populate({
        path: "bulkPhonePurchaseId",
        populate: {
          path: "ramSimDetails",
          populate: {
            path: "imeiNumbers",
            model: "Imei",
          },
        },
      })
      .populate("bankAccountUsed")
      .populate("pocketCash")
      .sort({ dateSold: -1 });

    const responseData = bulkSales.map((sale) => ({
      type: "Bulk Phone",
      id: sale._id,
      // Sale details
      salePrice: sale.salePrice,
      totalInvoice: sale.totalInvoice,
      sellingPaymentType: sale.sellingPaymentType,
      profit: sale.profit || 0,
      warranty: sale.warranty,
      dateSold: sale.dateSold,
      customerName: sale.customerName,
      customerNumber: sale.customerNumber,
      invoiceNumber: sale.invoiceNumber,
      dispatch: sale.dispatch,
      // Payment details
      bankAccountUsed: sale.bankAccountUsed,
      pocketCash: sale.pocketCash,
      // Bulk purchase details
      bulkPurchase: {
        id: sale.bulkPhonePurchaseId?._id,
        date: sale.bulkPhonePurchaseId?.date,
        purchasePaymentStatus: sale.bulkPhonePurchaseId?.purchasePaymentStatus,
        purchasePaymentType: sale.bulkPhonePurchaseId?.purchasePaymentType,
        prices: sale.bulkPhonePurchaseId?.prices,
        creditPaymentData: sale.bulkPhonePurchaseId?.creditPaymentData,
        status: sale.bulkPhonePurchaseId?.status,
        ramSimDetails: sale.bulkPhonePurchaseId?.ramSimDetails?.map(
          (ramSim) => ({
            id: ramSim._id,
            companyName: ramSim.companyName,
            modelName: ramSim.modelName,
            ramMemory: ramSim.ramMemory,
            simOption: ramSim.simOption,
            priceOfOne: ramSim.priceOfOne,
            imeiNumbers: ramSim.imeiNumbers?.map((imei) => ({
              id: imei._id,
              imei1: imei.imei1,
              imei2: imei.imei2,
              color: imei.color,
              batteryHealth: imei.batteryHealth,
              isDispatched: imei.isDispatched,
            })),
          })
        ),
        dispatch: sale.bulkPhonePurchaseId?.dispatch,
      },
      // Accessories
      accessories: sale.accessories,
      // IMEI details
      imei1: sale.imei1,
      imei2: sale.imei2,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    }));

    res.status(200).json({
      message: "Bulk phone sales retrieved successfully!",
      data: responseData,
      count: responseData.length,
    });
  } catch (error) {
    console.error("Error fetching bulk sales:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getSoldBulkPhoneDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const saleDetail = await SoldPhone.findById(id).populate({
      path: "bulkPhonePurchaseId",
      model: "BulkPhonePurchase",
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

exports.getDeviceByImei = async (req, res) => {
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
      return res
        .status(404)
        .json({ error: "No phone details found for this user." });
    }

    res.status(200).json({ bulkPhone, purchasePhone });
  } catch (error) {
    console.error("Error fetching phone details:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.payBulkPurchaseCreditAmount = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from request
    const bulkPhonePurchaseId = req.params.id;
    const { amountToPay } = req.body;
    const bulkPhonePurchase = await BulkPhonePurchase.findById(
      bulkPhonePurchaseId
    );
    if (!userId) {
      return res.status(404).json({ message: "Authenticate please" });
    }
    if (!bulkPhonePurchase) {
      return res.status(404).json({ message: "Bulk phone purchase not found" });
    }
    if (bulkPhonePurchase.purchasePaymentStatus === "Paid") {
      return res.status(400).json({ message: "Payment already made" });
    }
    if (
      bulkPhonePurchase.creditPaymentData.payableAmountLater === 0 ||
      bulkPhonePurchase.creditPaymentData.payableAmountLater === "0"
    ) {
      return res.status(400).json({ message: "No amount to pay" });
    }

    const response =
      Number(bulkPhonePurchase.creditPaymentData.payableAmountLater) -
      Number(amountToPay);
    if (response < 0) {
      return res
        .status(400)
        .json({ message: "Amount to pay is greater than payable amount" });
    }
    bulkPhonePurchase.creditPaymentData.payableAmountLater = response;
    if (response === 0) {
      bulkPhonePurchase.purchasePaymentStatus = "paid";
    }

    // Initialize totalPaidAmount with payableAmountNow if it's the first payment
    // if (!bulkPhonePurchase.creditPaymentData.totalPaidAmount) {
    //   bulkPhonePurchase.creditPaymentData.totalPaidAmount = Number(bulkPhonePurchase.creditPaymentData.payableAmountNow) || 0;
    // }

    // Add amountToPay to totalPaidAmount
    bulkPhonePurchase.creditPaymentData.totalPaidAmount += Number(amountToPay);

    bulkPhonePurchase.save();
    res
      .status(200)
      .json({ message: "Payment made successfully", bulkPhonePurchase });
  } catch (error) {
    console.error("Error paying credit amount:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

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

    res
      .status(200)
      .json({ message: "Phone dispatched", dispatch: dispatchEntry });
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
    const deletedDispatch = await Dispatch.findOneAndDelete({
      purchasePhoneId,
      userId,
    });

    if (!deletedDispatch) {
      return res
        .status(404)
        .json({ message: "Dispatch record not found or unauthorized" });
    }

    return res.status(200).json({
      message: "Phone return processed successfully",
      phone: updatedPhone,
      dispatch: deletedDispatch,
    });
  } catch (error) {
    console.error("Error returning dispatched phone:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    const ramSimIds = ramSimEntries.map((r) => r._id);

    // Get all IMEI documents under those RamSim entries
    const allImeis = await Imei.find({ ramSimId: { $in: ramSimIds } });

    let imeisToDispatch;

    // If user passed imeiArray with imei1/imei2 structure
    if (imeiArray.length > 0) {
      const imei1List = imeiArray
        .map((item) => item.imei1?.trim())
        .filter(Boolean);
      imeisToDispatch = allImeis.filter((i) => imei1List.includes(i.imei1));

      if (imeisToDispatch.length === 0) {
        return res
          .status(400)
          .json({ message: "No matching IMEI1s found for dispatch." });
      }
    } else {
      if (bulkPurchase.dispatch) {
        return res
          .status(400)
          .json({ message: "Bulk phones already dispatched" });
      }
      imeisToDispatch = allImeis;
    }

    const imeiIdsToDispatch = imeisToDispatch.map((i) => i._id);

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
      isDispatched: { $ne: true },
    });

    const allDispatched = undispatchedImeis.length === 0;

    if (allDispatched && !bulkPurchase.dispatch) {
      await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, {
        dispatch: true,
      });
    }

    res.status(200).json({
      message: "Bulk phones dispatched",
      dispatch: dispatchEntry,
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

    console.log("this is the imeiArray", imeiArray);

    const dispatchEntry = await Dispatch.findById(dispatchId);
    if (!dispatchEntry) {
      return res.status(404).json({ message: "Dispatch entry not found" });
    }

    const bulkPhonePurchaseId = dispatchEntry.bulkPhonePurchaseId;
    const dispatchedImeiIds = dispatchEntry.dispatchedImeiIds.map((id) =>
      id.toString()
    );

    const allImeis = await Imei.find({ _id: { $in: dispatchedImeiIds } });

    let imeiIdsToReturn = [];

    if (imeiArray.length > 0) {
      const imei1List = imeiArray
        .map((item) => item.imei1?.trim())
        .filter(Boolean);

      const filtered = allImeis.filter((i) => imei1List.includes(i.imei1));
      imeiIdsToReturn = filtered.map((i) => i._id.toString());

      console.log("IMEIs to return:", imeiIdsToReturn);
      console.log("Dispatched IMEIs:", dispatchedImeiIds);

      if (imeiIdsToReturn.length === 0) {
        return res
          .status(400)
          .json({ message: "No matching IMEIs found to return." });
      }

      await Imei.updateMany(
        { _id: { $in: imeiIdsToReturn } },
        { $set: { isDispatched: false } }
      );

      const remainingImeiIds = dispatchedImeiIds.filter(
        (id) => !imeiIdsToReturn.includes(id)
      );
      console.log("Remaining IMEIs after return:", remainingImeiIds);

      if (remainingImeiIds.length === 0) {
        // All returned
        await Dispatch.findByIdAndDelete(dispatchId);
        await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, {
          dispatch: false,
        });
      } else {
        // Partial return
        await Dispatch.findByIdAndUpdate(dispatchId, {
          dispatchedImeiIds: remainingImeiIds,
        });
        await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, {
          dispatch: true,
        });
      }
    } else {
      // FULL return
      await Imei.updateMany(
        { _id: { $in: dispatchedImeiIds } },
        { $set: { isDispatched: false } }
      );
      await Dispatch.findByIdAndDelete(dispatchId);
      await BulkPhonePurchase.findByIdAndUpdate(bulkPhonePurchaseId, {
        dispatch: false,
      });
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
        path: "purchasePhoneId",
        model: "PurchasePhone",
      })
      .lean();

    res.status(200).json({ dispatches });
  } catch (error) {
    console.error("Error fetching single phone dispatches:", error);
    res.status(500).json({ message: "Internal server error", error });
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
        path: "bulkPhonePurchaseId",
        model: "BulkPhonePurchase",
        populate: {
          path: "ramSimDetails",
          model: "RamSim",
          populate: {
            path: "imeiNumbers",
            model: "Imei",
          },
        },
      })
      .lean();

    const formattedDispatches = dispatches.map((dispatch) => {
      const ramSimDetails = (dispatch.bulkPhonePurchaseId?.ramSimDetails || [])
        .filter(
          (ramSim) =>
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
      "Error fetching and formatting bulk dispatches:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal server error", error });
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
    return res
      .status(400)
      .json({ message: "Customer number and user ID are required" });
  }

  try {
    const singleSoldPhone = await SingleSoldPhone.find({
      customerNumber,
      userId,
    });
    const singlePurchasePhone = await PurchasePhone.find({
      mobileNumber: customerNumber,
      userId,
    });
    // const soldPhones = await SoldPhone.find({ customerNumber, userId });

    const combinedResults = [
      ...singleSoldPhone.map((item) => ({ ...item, type: "sold" })),
      ...singlePurchasePhone.map((item) => ({ ...item, type: "purchase" })),
    ];

    if (combinedResults.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this customer number" });
    }

    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// exports.soldAnyPhone = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { imei, ...otherDetails } = req.body;

//     if (!imei) {
//       return res.status(400).json({ error: "IMEI number is required." });
//     }

//     // 1. Try to find and sell in single purchase phone
//     const purchasePhone = await PurchasePhone.findOne({
//       userId,
//       $or: [{ imei1: imei }, { imei2: imei }],
//     });

//     if (purchasePhone) {
//       // Mark as sold, create SingleSoldPhone with extra details, then remove from PurchasePhone
//       purchasePhone.isSold = true;
//       await purchasePhone.save();

//       const soldPhone = new SingleSoldPhone({
//         purchasePhoneId: purchasePhone._id,
//         userId,
//         shopid: purchasePhone.shopid,
//         name: purchasePhone.name,
//         fatherName: purchasePhone.fatherName,
//         companyName: purchasePhone.companyName,
//         modelName: purchasePhone.modelName,
//         purchaseDate: purchasePhone.date,
//         phoneCondition: purchasePhone.phoneCondition,
//         warranty: purchasePhone.warranty,
//         specifications: purchasePhone.specifications,
//         ramMemory: purchasePhone.ramMemory,
//         color: purchasePhone.color,
//         imei1: purchasePhone.imei1,
//         imei2: purchasePhone.imei2,
//         phonePicture: purchasePhone.phonePicture,
//         personPicture: purchasePhone.personPicture,
//         accessories: purchasePhone.accessories,
//         purchasePrice: purchasePhone.price?.purchasePrice,
//         finalPrice: purchasePhone.price?.finalPrice,
//         demandPrice: purchasePhone.price?.demandPrice,
//         isApprovedFromEgadgets: purchasePhone.isApprovedFromEgadgets,
//         eGadgetStatusPicture: purchasePhone.eGadgetStatusPicture,
//         invoiceNumber: "INV-" + new Date().getTime(),
//         ...otherDetails, // Allow user to add extra details
//       });

//       await soldPhone.save();
//       await PurchasePhone.findByIdAndDelete(purchasePhone._id);

//       return res.status(200).json({
//         message: "Phone sold and removed from single purchase.",
//         type: "single",
//         imei,
//         soldPhone,
//       });
//     }

//     // 2. Try to find and sell in bulk purchase
//     const bulkPhone = await BulkPhonePurchase.findOne({ userId }).populate({
//       path: "ramSimDetails",
//       populate: { path: "imeiNumbers" },
//     });

//     if (bulkPhone) {
//       let found = false;
//       let soldPhone = null;
//       for (const ramSim of bulkPhone.ramSimDetails) {
//         const imeiIndex = ramSim.imeiNumbers.findIndex(
//           (i) => i.imei1 === imei || i.imei2 === imei
//         );
//         if (imeiIndex !== -1) {
//           // Remove IMEI from Imei collection and from ramSim.imeiNumbers
//           const imeiDoc = ramSim.imeiNumbers[imeiIndex];

//           // Create SoldPhone record with extra details
//           soldPhone = new SoldPhone({
//             bulkPhonePurchaseId: bulkPhone._id,
//             imei1: imeiDoc.imei1,
//             imei2: imeiDoc.imei2,
//             userId,
//             companyName: bulkPhone.companyName,
//             modelName: bulkPhone.modelName,
//             ramMemory: ramSim.ramMemory,
//             simOption: ramSim.simOption,
//             priceOfOne: ramSim.priceOfOne,
//             ...otherDetails, // Allow user to add extra details
//             invoiceNumber: "INV-" + new Date().getTime(),
//           });
//           await soldPhone.save();

//           await Imei.findByIdAndDelete(imeiDoc._id);
//           ramSim.imeiNumbers.splice(imeiIndex, 1);
//           await ramSim.save();
//           found = true;
//           break;
//         }
//       }
//       if (found) {
//         return res.status(200).json({
//           message: "IMEI sold and removed from bulk purchase.",
//           type: "bulk",
//           imei,
//           soldPhone,
//         });
//       }
//     }

//     return res
//       .status(404)
//       .json({ message: "IMEI not found in single or bulk purchase." });
//   } catch (error) {
//     console.error("Error processing sold phone:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };
// exports.soldAnyPhone = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { imeis, ...otherDetails } = req.body;
//     const accessories = req.body.accessories || [];

//     if (!Array.isArray(imeis) || imeis.length === 0) {
//       return res.status(400).json({ error: "IMEI array is required." });
//     }

//     const soldPhones = [];
//     const notFoundImeis = [];

//     // Get all bulk phones for this user (not just one)
//     const bulkPhones = await BulkPhonePurchase.find({ userId }).populate({
//       path: "ramSimDetails",
//       populate: { path: "imeiNumbers" },
//     });

//     for (const imei of imeis) {
//       let found = false;

//       // Try single purchase
//       const purchasePhone = await PurchasePhone.findOne({
//         userId,
//         $or: [{ imei1: imei }, { imei2: imei }],
//       });
//       console.log("otherDetail", otherDetails);

//       if (purchasePhone) {
//         purchasePhone.isSold = true;
//         await purchasePhone.save();

//         const soldPhone = new SingleSoldPhone({
//           purchasePhoneId: purchasePhone._id,
//           userId,
//           dateSold: otherDetails.saleDate,
//           shopid: purchasePhone.shopid,
//           name: purchasePhone.name,
//           fatherName: purchasePhone.fatherName,
//           companyName: purchasePhone.companyName,
//           modelName: purchasePhone.modelName,
//           purchaseDate: purchasePhone.date,
//           phoneCondition: purchasePhone.phoneCondition,
//           warranty: purchasePhone.warranty,
//           specifications: purchasePhone.specifications,
//           ramMemory: purchasePhone.ramMemory,
//           color: purchasePhone.color,
//           imei1: purchasePhone.imei1,
//           imei2: purchasePhone.imei2,
//           phonePicture: purchasePhone.phonePicture,
//           personPicture: purchasePhone.personPicture,
//           accessories: purchasePhone.accessories,
//           purchasePrice: purchasePhone.price?.purchasePrice,
//           finalPrice: purchasePhone.price?.finalPrice,
//           demandPrice: purchasePhone.price?.demandPrice,
//           isApprovedFromEgadgets: purchasePhone.isApprovedFromEgadgets,
//           eGadgetStatusPicture: purchasePhone.eGadgetStatusPicture,
//           invoiceNumber: "INV-" + new Date().getTime(),
//           ...otherDetails,
//         });

//         await soldPhone.save();
//         // Delete the phone from single purchase collection
//         await PurchasePhone.findByIdAndDelete(purchasePhone._id);

//         soldPhones.push({ imei, type: "single", soldPhone });
//         found = true;
//         continue;
//       }

//       // Try bulk purchase if not found
//       for (const bulkPhone of bulkPhones) {
//         let ramSimToRemove = [];
//         let ramSimChanged = false;
//         for (const ramSim of bulkPhone.ramSimDetails) {
//           const imeiIndex = ramSim.imeiNumbers.findIndex(
//             (i) => i.imei1 === imei || i.imei2 === imei
//           );
//           if (imeiIndex !== -1) {
//             const imeiDoc = ramSim.imeiNumbers[imeiIndex];

//             const soldPhone = new SoldPhone({
//               bulkPhonePurchaseId: bulkPhone._id,
//               imei1: imeiDoc.imei1,
//               imei2: imeiDoc.imei2,
//               userId,
//               dateSold: otherDetails.saleDate,
//               companyName: bulkPhone.companyName,
//               modelName: bulkPhone.modelName,
//               ramMemory: ramSim.ramMemory,
//               simOption: ramSim.simOption,
//               priceOfOne: ramSim.priceOfOne,
//               invoiceNumber: "INV-" + new Date().getTime(),
//               ...otherDetails,
//             });

//             await soldPhone.save();

//             if (imeiDoc && imeiDoc._id) {
//               await Imei.findByIdAndDelete(imeiDoc._id);
//             } else if (
//               typeof imeiDoc === "string" ||
//               imeiDoc instanceof mongoose.Types.ObjectId
//             ) {
//               await Imei.findByIdAndDelete(imeiDoc);
//             }

//             ramSim.imeiNumbers.splice(imeiIndex, 1);
//             ramSimChanged = true;
//             await ramSim.save();

//             // If ramSim.imeiNumbers is now empty, mark for removal from bulkPhone
//             if (ramSim.imeiNumbers.length === 0) {
//               ramSimToRemove.push(ramSim._id.toString());
//             }

//             soldPhones.push({ imei, type: "bulk", soldPhone });
//             found = true;
//             break;
//           }
//         }
//         // Remove empty ramSimDetails from bulkPhone
//         if (ramSimChanged && ramSimToRemove.length > 0) {
//           bulkPhone.ramSimDetails = bulkPhone.ramSimDetails.filter(
//             (ramSim) => !ramSimToRemove.includes(ramSim._id.toString())
//           );
//           await bulkPhone.save();
//         }
//         // If after removal, bulkPhone.ramSimDetails is empty, delete the bulkPhonePurchase
//         if (ramSimChanged && bulkPhone.ramSimDetails.length === 0) {
//           await BulkPhonePurchase.findByIdAndDelete(bulkPhone._id);
//         }
//         if (found) break;
//       }

//       if (!found) {
//         notFoundImeis.push(imei);
//       }
//     }

//     if (accessories && accessories.length > 0) {
//       for (const accessoryItem of accessories) {
//         const accessory = await Accessory.findOne({
//           _id: accessoryItem.name,
//           userId: req.user.id,
//         });

//         if (!accessory) {
//           return res.status(404).json({ message: "Accessory not found" });
//         }

//         if (Number(accessory.stock) < Number(accessoryItem.quantity)) {
//           return res.status(400).json({ message: "Insufficient Inventory" });
//         }

//         const totalPrice =
//           Number(accessoryItem.quantity) * Number(accessoryItem.price);

//         await AccessoryTransaction.create({
//           userId: req.user.id,
//           accessoryId: accessoryItem.name,
//           quantity: Number(accessoryItem.quantity),
//           perPiecePrice: Number(accessoryItem.price),
//           totalPrice,
//         });

//         accessory.stock -= Number(accessoryItem.quantity);
//         accessory.totalPrice -=
//           Number(accessory.perPiecePrice) * Number(accessoryItem.quantity);
//         accessory.profit +=
//           (Number(accessoryItem.price) - Number(accessory.perPiecePrice)) *
//           Number(accessoryItem.quantity);
//         await accessory.save();
//       }
//     }

//      if (otherDetails?.bankAccountUsed) {
//       const bank = await AddBankAccount.findById(otherDetails?.bankAccountUsed);
//       if (!bank) return res.status(404).json({ message: "Bank not found" });

//       // Deduct purchasePrice from accountCash
//       bank.accountCash += Number(otherDetails?.accountCash);
//       await bank.save();

//       // Log the transaction
//       await BankTransaction.create({
//         bankId: bank._id,
//         userId: req.user.id,
//         sourceOfAmountAddition: `sale of mobile `,
//         accountCash: otherDetails?.accountCash,
//         accountType: bank.accountType,
//       });
//     }
//     if (otherDetails?.pocketCash) {
//       const pocketTransaction = await PocketCashSchema.findOne({
//         userId: req.user.id,
//       });
//       if (!pocketTransaction) {
//         return res
//           .status(404)
//           .json({ message: "Pocket cash account not found." });
//       }

//       pocketTransaction.accountCash += Number(otherDetails?.pocketCash);
//       await pocketTransaction.save();

//       await PocketCashTransactionSchema.create({
//         userId: req.user.id,
//         pocketCashId: pocketTransaction._id, // if you want to associate it
//         amountDeducted: otherDetails?.pocketCash,
//         accountCash: pocketTransaction.accountCash, // ✅ add this line
//         remainingAmount: pocketTransaction.accountCash,
//         reasonOfAmountDeduction: `sale of mobile`,
//         sourceOfAmountAddition: "Payment for mobile sale",
//       });
//     }

//     return res.status(200).json({
//       message: "Processed IMEIs.",
//       soldCount: soldPhones.length,
//       notFoundCount: notFoundImeis.length,
//       soldPhones,
//       notFoundImeis,
//     });
//   } catch (error) {
//     console.error("Error processing sold phones:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };
exports.soldAnyPhone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imeis, bankAccountUsed, accountCash, pocketCash, ...phoneDetails } =
      req.body;
    const accessories = req.body.accessories || [];

    if (!Array.isArray(imeis) || imeis.length === 0) {
      console.log(
        "bankAccountUsed",
        bankAccountUsed,
        "accountCash",
        accountCash,
        "pocketCash",
        pocketCash
      );
      return res.status(400).json({ error: "IMEI array is required." });
    }

    const soldPhones = [];
    const notFoundImeis = [];

    // Get all bulk phones for this user (not just one)
    const bulkPhones = await BulkPhonePurchase.find({ userId }).populate({
      path: "ramSimDetails",
      populate: { path: "imeiNumbers" },
    });

    for (const imei of imeis) {
      let found = false;

      // Try single purchase
      const purchasePhone = await PurchasePhone.findOne({
        userId,
        $or: [{ imei1: imei }, { imei2: imei }],
      });

      if (purchasePhone) {
        purchasePhone.isSold = true;
        await purchasePhone.save();

        const soldPhone = new SingleSoldPhone({
          purchasePhoneId: purchasePhone._id,
          userId,
          dateSold: phoneDetails.saleDate,
          shopid: purchasePhone.shopid,
          name: purchasePhone.name,
          fatherName: purchasePhone.fatherName,
          companyName: purchasePhone.companyName,
          modelName: purchasePhone.modelName,
          purchaseDate: purchasePhone.date,
          phoneCondition: purchasePhone.phoneCondition,
          warranty: purchasePhone.warranty,
          specifications: purchasePhone.specifications,
          ramMemory: purchasePhone.ramMemory,
          color: purchasePhone.color,
          imei1: purchasePhone.imei1,
          imei2: purchasePhone.imei2,
          phonePicture: purchasePhone.phonePicture,
          personPicture: purchasePhone.personPicture,
          accessories: purchasePhone.accessories,
          purchasePrice: purchasePhone.price?.purchasePrice,
          finalPrice: purchasePhone.price?.finalPrice,
          demandPrice: purchasePhone.price?.demandPrice,
          isApprovedFromEgadgets: purchasePhone.isApprovedFromEgadgets,
          eGadgetStatusPicture: purchasePhone.eGadgetStatusPicture,
          invoiceNumber: "INV-" + new Date().getTime(),
          ...phoneDetails, // Now filtered to exclude financial fields
        });

        await soldPhone.save();
        // Delete the phone from single purchase collection
        await PurchasePhone.findByIdAndDelete(purchasePhone._id);

        soldPhones.push({ imei, type: "single", soldPhone });
        found = true;
        continue;
      }

      // Try bulk purchase if not found
      for (const bulkPhone of bulkPhones) {
        let ramSimToRemove = [];
        let ramSimChanged = false;
        for (const ramSim of bulkPhone.ramSimDetails) {
          const imeiIndex = ramSim.imeiNumbers.findIndex(
            (i) => i.imei1 === imei || i.imei2 === imei
          );
          if (imeiIndex !== -1) {
            const imeiDoc = ramSim.imeiNumbers[imeiIndex];

            const soldPhone = new SoldPhone({
              bulkPhonePurchaseId: bulkPhone._id,
              imei1: imeiDoc.imei1,
              imei2: imeiDoc.imei2,
              userId,
              dateSold: phoneDetails.saleDate,
              companyName: bulkPhone.companyName,
              modelName: bulkPhone.modelName,
              ramMemory: ramSim.ramMemory,
              simOption: ramSim.simOption,
              priceOfOne: ramSim.priceOfOne,
              invoiceNumber: "INV-" + new Date().getTime(),
              ...phoneDetails, // Now filtered to exclude financial fields
            });

            await soldPhone.save();

            if (imeiDoc && imeiDoc._id) {
              await Imei.findByIdAndDelete(imeiDoc._id);
            } else if (
              typeof imeiDoc === "string" ||
              imeiDoc instanceof mongoose.Types.ObjectId
            ) {
              await Imei.findByIdAndDelete(imeiDoc);
            }

            ramSim.imeiNumbers.splice(imeiIndex, 1);
            ramSimChanged = true;
            await ramSim.save();

            // If ramSim.imeiNumbers is now empty, mark for removal from bulkPhone
            if (ramSim.imeiNumbers.length === 0) {
              ramSimToRemove.push(ramSim._id.toString());
            }

            soldPhones.push({ imei, type: "bulk", soldPhone });
            found = true;
            break;
          }
        }
        // Remove empty ramSimDetails from bulkPhone
        if (ramSimChanged && ramSimToRemove.length > 0) {
          bulkPhone.ramSimDetails = bulkPhone.ramSimDetails.filter(
            (ramSim) => !ramSimToRemove.includes(ramSim._id.toString())
          );
          await bulkPhone.save();
        }
        // If after removal, bulkPhone.ramSimDetails is empty, delete the bulkPhonePurchase
        if (ramSimChanged && bulkPhone.ramSimDetails.length === 0) {
          await BulkPhonePurchase.findByIdAndDelete(bulkPhone._id);
        }
        if (found) break;
      }

      if (!found) {
        notFoundImeis.push(imei);
      }
    }

    if (accessories && accessories.length > 0) {
      for (const accessoryItem of accessories) {
        const accessory = await Accessory.findOne({
          _id: accessoryItem.name,
          userId: req.user.id,
        });

        if (!accessory) {
          return res.status(404).json({ message: "Accessory not found" });
        }

        if (Number(accessory.stock) < Number(accessoryItem.quantity)) {
          return res.status(400).json({ message: "Insufficient Inventory" });
        }

        const totalPrice =
          Number(accessoryItem.quantity) * Number(accessoryItem.price);

        await AccessoryTransaction.create({
          userId: req.user.id,
          accessoryId: accessoryItem.name,
          type: "sale",
          quantity: Number(accessoryItem.quantity),
          perPiecePrice: Number(accessoryItem.price),
          totalPrice,
        });

        accessory.stock -= Number(accessoryItem.quantity);
        accessory.totalPrice -=
          Number(accessory.perPiecePrice) * Number(accessoryItem.quantity);
        accessory.profit +=
          (Number(accessoryItem.price) - Number(accessory.perPiecePrice)) *
          Number(accessoryItem.quantity);
        await accessory.save();
      }
    }

    // Handle financial transactions separately
    if (bankAccountUsed) {
      const bank = await AddBankAccount.findById(bankAccountUsed);
      if (!bank) return res.status(404).json({ message: "Bank not found" });

      // Add the sale amount to accountCash
      bank.accountCash += Number(accountCash || 0);
      await bank.save();

      // Log the transaction
      await BankTransaction.create({
        bankId: bank._id,
        userId: req.user.id,
        sourceOfAmountAddition: `sale of mobile`,
        accountCash: accountCash || 0,
        accountType: bank.accountType,
      });
    }

    if (pocketCash) {
      const pocketTransaction = await PocketCashSchema.findOne({
        userId: req.user.id,
      });
      if (!pocketTransaction) {
        return res
          .status(404)
          .json({ message: "Pocket cash account not found." });
      }

      pocketTransaction.accountCash += Number(pocketCash || 0);
      await pocketTransaction.save();

      await PocketCashTransactionSchema.create({
        userId: req.user.id,
        pocketCashId: pocketTransaction._id,
        amountDeducted: pocketCash || 0,
        accountCash: pocketTransaction.accountCash,
        remainingAmount: pocketTransaction.accountCash,
        reasonOfAmountDeduction: `sale of mobile`,
        sourceOfAmountAddition: "Payment for mobile sale",
      });
    }

    return res.status(200).json({
      message: "Processed IMEIs.",
      soldCount: soldPhones.length,
      notFoundCount: notFoundImeis.length,
      soldPhones,
      notFoundImeis,
    });
  } catch (error) {
    console.error("Error processing sold phones:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.updateSoldPhone = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from request
    if (!userId) {
      return res.status(404).json({ message: "Authenticate please" });
    }
    const { id } = req.params;
    const updateData = req.body;
    console.log("Update data:", updateData);

    // Try to update in SingleSoldPhone first
    let singleSoldPhone = await SingleSoldPhone.findById(id);
    if (singleSoldPhone) {
      Object.assign(singleSoldPhone, updateData);
      await singleSoldPhone.save();
      return res.status(200).json({
        message: "Single sold phone record updated successfully",
        soldPhone: singleSoldPhone,
      });
    }
    console.log(
      "Single sold phone not found, checking SoldPhone...",
      singleSoldPhone
    );

    // Find the sold phone record
    const soldPhone = await SoldPhone.findById(id);
    if (!soldPhone) {
      return res.status(404).json({ message: "Sold phone record not found" });
    }

    // Update the sold phone record
    Object.assign(soldPhone, updateData);
    await soldPhone.save();

    return res
      .status(200)
      .json({ message: "Sold phone record updated successfully", soldPhone });
  } catch (error) {
    console.error("Error updating sold phone:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.deleteSoldPhone = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);

    // Validate id before querying

    // Check if the sold phone exists in SingleSoldPhone as well
    let singleSoldPhone = await SingleSoldPhone.findById(id);
    if (singleSoldPhone) {
      await SingleSoldPhone.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ message: "Single sold phone record deleted successfully" });
    }

    // Find the sold phone record
    const soldPhone = await SoldPhone.findById(id);
    if (!soldPhone) {
      return res.status(404).json({ message: "Sold phone record not found" });
    }

    // Delete the sold phone record
    await SoldPhone.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ message: "Sold phone record deleted successfully" });
  } catch (error) {
    console.error("Error deleting sold phone:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.getDetailByImeiNumber = async (req, res) => {
  try {
    let { imei } = req.params;
    const userId = req.user.id;

    if (!imei) {
      return res.status(400).json({ error: "IMEI number is required." });
    }

    // Support comma-separated IMEIs
    let imeiList = Array.isArray(imei)
      ? imei
      : imei
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);

    const results = [];

    for (const singleImei of imeiList) {
      // 1. Check in single purchase
      const singlePurchasePhone = await PurchasePhone.findOne({
        userId,
        $or: [{ imei1: singleImei }, { imei2: singleImei }],
      });

      if (singlePurchasePhone) {
        results.push({
          imei1: singlePurchasePhone.imei1,
          companyName: singlePurchasePhone.companyName,
          modelName: singlePurchasePhone.modelName,
          specifications: singlePurchasePhone.specifications,
          ramMemory: singlePurchasePhone.ramMemory,
          batteryHealth: singlePurchasePhone.batteryHealth,
          color: singlePurchasePhone.color,
          simOption: singlePurchasePhone.simOption || "",
          type: "single",
        });
        continue;
      }

      // 2. Check in bulk purchase (deep search in IMEI collection)
      const bulkPhones = await BulkPhonePurchase.find({ userId }).populate({
        path: "ramSimDetails",
        populate: { path: "imeiNumbers" },
      });

      let found = false;
      for (const bulkPhone of bulkPhones) {
        for (const ramSim of bulkPhone.ramSimDetails) {
          for (const imeiDoc of ramSim.imeiNumbers) {
            if (imeiDoc.imei1 === singleImei || imeiDoc.imei2 === singleImei) {
              results.push({
                imei1: imeiDoc.imei1,
                companyName: ramSim.companyName || bulkPhone.companyName,
                modelName: ramSim.modelName || bulkPhone.modelName,
                specifications: ramSim.specifications || "",
                ramMemory: ramSim.ramMemory,
                batteryHealth:
                  imeiDoc.batteryHealth || ramSim.batteryHealth || "",
                color: imeiDoc.color || "",
                simOption: ramSim.simOption || "",
                type: "bulk",
              });
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      if (!found) {
        results.push({
          imei1: singleImei,
          type: "not_found",
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Error fetching phone details by IMEI:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
exports.returnSingleSoldToPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { newBuyingPrice, remainingWarranty } = req.body;

    console.log(
      "Returning single sold phone to purchase:",
      id,
      userId,
      newBuyingPrice,
      remainingWarranty
    );
    if (!userId) {
      return res.status(404).json({ message: "Authenticate please" });
    }
    // Only handle SingleSoldPhone
    const singleSoldPhone = await SingleSoldPhone.findById(id);
    if (!singleSoldPhone) {
      return res
        .status(404)
        .json({ message: "Single sold phone record not found" });
    }
    console.log("Single sold phone record found:", singleSoldPhone);

    // Create a new PurchasePhone record from SingleSoldPhone
    const purchasePhone = new PurchasePhone({
      userId,
      shopid: singleSoldPhone.shopid,
      name: singleSoldPhone.name,
      mobileNumber: singleSoldPhone.mobileNumber,
      fatherName: singleSoldPhone.fatherName,
      cnic:
        singleSoldPhone.cnicNumber ||
        singleSoldPhone.customerCnic ||
        singleSoldPhone.cnic ||
        "", // Fix: ensure cnic is set
      companyName: singleSoldPhone.companyName,
      modelName: singleSoldPhone.modelName,
      date: singleSoldPhone.purchaseDate,
      phoneCondition: singleSoldPhone.phoneCondition,
      warranty: remainingWarranty || singleSoldPhone.warranty,
      specifications: singleSoldPhone.specifications,
      ramMemory: singleSoldPhone.ramMemory,
      color: singleSoldPhone.color,
      imei1: singleSoldPhone.imei1,
      imei2: singleSoldPhone.imei2,
      phonePicture: singleSoldPhone.phonePicture,
      personPicture: singleSoldPhone.personPicture,
      accessories: singleSoldPhone.accessories,
      price: {
        purchasePrice: Number(newBuyingPrice) || singleSoldPhone.purchasePrice,
        finalPrice: singleSoldPhone.finalPrice,
        demandPrice: singleSoldPhone.demandPrice,
      },
      isApprovedFromEgadgets: singleSoldPhone.isApprovedFromEgadgets,
      eGadgetStatusPicture: singleSoldPhone.eGadgetStatusPicture,
      invoiceNumber: singleSoldPhone.invoiceNumber,
    });
    await purchasePhone.save();

    // Delete the sold phone record
    await SingleSoldPhone.findByIdAndDelete(id);
    return res.status(200).json({
      message: "Single sold phone record returned to purchase successfully",
      purchasePhone,
    });
  } catch (error) {
    console.error("Error returning sold phone to purchase:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
