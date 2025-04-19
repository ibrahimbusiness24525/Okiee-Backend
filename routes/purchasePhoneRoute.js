const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    addPurchasePhone,
    getAllPurchasePhone,
    getPurchasePhoneByFilter,
    getPurchasePhoneById,
    deletePurchasePhone,
    addBulkPhones,
    getBulkPhone,
    getAllPurchasePhones,
    sellPhonesFromBulk,
    getAllSales,
    getAllBulkSales,
    getBulkPhoneById,
    getBulkPhoneSaleById,
    getSoldBulkPhoneDetailById,
    sellSinglePhone,
    getAllSingleSoldPhones,
    deleteBulkPhone,
    getSingleSoldPhoneById,
    getBulkSoldPhoneById,
    getDeviceByImei,
    updateSinglePurchasePhone,
    payBulkPurchaseCreditAmount,
    updateBulkPhonePurchase,
    dispatchSinglePurchase,
    dispatchBulkPurchase,
    getSingleDispatches,
    getBulkDispatches,
    dispatchSingleReturn,
    returnBulkDispatch,
    getCustomerSalesRecordDetailsByNumber
} = require('../controllers/purchasePhoneController');
const { decoderMiddleware } = require('../services/authServices');

// Multer setup for file uploads (specific for adding purchase phones)
const upload = multer({ dest: 'uploads/' }); 

// Route to add a new purchase phone slip (with file upload support)
router.post(
    '/purchase-phone',
    // upload.fields([
    //     { name: 'phonePicture', maxCount: 1 },
    //     { name: 'personPicture', maxCount: 1 },
    //     { name: 'eGadgetStatusPicture', maxCount: 1 }
    // ]),
    //  (req, res, next) => { 
    //     console.log("After Multer:", req.files); 
    //     next(); 
    // },
    decoderMiddleware,
    addPurchasePhone
);//used to purchasesingle phone

router.post(
    '/bulk-phone-purchase',decoderMiddleware,addBulkPhones//used
);
router.put(
    '/bulk-phone-update/:id',updateBulkPhonePurchase//used to edit bulk
);
router.get(
    '/bulk-phone-purchase',decoderMiddleware,getBulkPhone//used to get all bulk only
);
router.post(
    '/sell-single-phone',decoderMiddleware,sellSinglePhone//used to sell single phone only
);
router.get(
    '/sold-single-phones',decoderMiddleware,getAllSingleSoldPhones//used to sell single phone only
);

// Route to get all purchase phone slips
router.get('/purchase-phone',decoderMiddleware, getAllPurchasePhone);// used to get single phones only

// get all bulk and single phones
router.get('/all-purchase-phone',decoderMiddleware,getAllPurchasePhones);//used

// Route to get purchase phone slips with filtering
router.get('/purchase-phone/filter', getPurchasePhoneByFilter);

router.post('/sell-phone',decoderMiddleware, sellPhonesFromBulk);//used to sale bulk phones

router.get('/all-sales',decoderMiddleware, getAllSales);

router.get('/bulk-phone/sale/:id', getSoldBulkPhoneDetailById);

// Route to get a specific purchase phone slip by ID
router.get('/purchase-phone/:id', getPurchasePhoneById);
//Route to get getBulkPhoneById
router.get("/bulk-phone-purchase/:id",getBulkPhoneById)
// get single sold phone
router.get("/single-sold-phone/:id",decoderMiddleware,getSingleSoldPhoneById)
// get bulk sold phone
router.get("/bulk-sold-phone/:id",decoderMiddleware,getBulkSoldPhoneById)
// Route to edit a purchase phone slip by ID
router.put(
    '/single-purchase-phone/:id',
    updateSinglePurchasePhone
);

// Route to delete a purchase phone slip by ID
router.delete('/purchase-bulk/delete/:id',decoderMiddleware, deleteBulkPhone);
router.delete('/purchase-phone/delete/:id',decoderMiddleware, deletePurchasePhone);
router.get('/purchase-device/detail',decoderMiddleware, getDeviceByImei);
router.patch("/bulk-purchase-credit-pay/:id",decoderMiddleware,payBulkPurchaseCreditAmount);
router.patch("/bulk-purchase-dispatch/:id",decoderMiddleware,dispatchBulkPurchase);
router.patch("/single-purchase-dispatch/:id",decoderMiddleware,dispatchSinglePurchase);
router.get("/single-dispatch",decoderMiddleware,getSingleDispatches);
router.patch("/single-dispatch-return/:id",decoderMiddleware,dispatchSingleReturn);
router.get("/bulk-dispatch",decoderMiddleware,getBulkDispatches);
router.patch("/bulk-dispatch-return/:id",decoderMiddleware,returnBulkDispatch);
router.get("/customer-sold-record/:customerNumber",decoderMiddleware,getCustomerSalesRecordDetailsByNumber);
module.exports = router;
