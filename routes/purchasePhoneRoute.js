const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    addPurchasePhone,
    getAllPurchasePhone,
    getPurchasePhoneByFilter,
    getPurchasePhoneById,
    deletePurchasePhone,
    editPurchasePhone,
    addBulkPhones,
    getBulkPhone,
    getAllPurchasePhones,
    sellPhonesFromBulk,
    getAllSales,
    getAllBulkSales
} = require('../controllers/purchasePhoneController');

// Multer setup for file uploads (specific for adding purchase phones)
const upload = multer({ dest: 'uploads/' }); // You can modify the destination as needed

// Route to add a new purchase phone slip (with file upload support)
router.post(
    '/purchase-phone',
    upload.fields([
        { name: 'phonePicture', maxCount: 1 },
        { name: 'personPicture', maxCount: 1 },
        { name: 'eGadgetStatusPicture', maxCount: 1 }
    ]),
    addPurchasePhone
);

router.post(
    '/bulk-phone-purchase',addBulkPhones
);
router.get(
    '/bulk-phone-purchase',getBulkPhone
);

// Route to get all purchase phone slips
router.get('/purchase-phone', getAllPurchasePhone);
// get all bulk and single phones
router.get('/all-purchase-phone', getAllPurchasePhones);

// Route to get purchase phone slips with filtering
router.get('/purchase-phone/filter', getPurchasePhoneByFilter);

router.post('/sell-phone', sellPhonesFromBulk);

router.get('/all-sales', getAllSales);

// Route to get a specific purchase phone slip by ID
router.get('/purchase-phone/:id', getPurchasePhoneById);

// Route to edit a purchase phone slip by ID
router.put(
    '/purchase-phone/:id',
    upload.fields([
        { name: 'phonePicture', maxCount: 1 },
        { name: 'personPicture', maxCount: 1 },
        { name: 'eGadgetStatusPicture', maxCount: 1 }
    ]),
    editPurchasePhone
);

// Route to delete a purchase phone slip by ID
router.delete('/purchase-phone/:id', deletePurchasePhone);

module.exports = router;
