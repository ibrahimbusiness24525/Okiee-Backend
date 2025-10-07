const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { body } = require('express-validator');
const upload = require('../middleware/upload');
const { decoderMiddleware } = require('../services/authServices');

// Define validation rules
const shopValidationRules = [
    body('name').notEmpty().withMessage('Name is required'),
    body('address').notEmpty().withMessage('Address is required'),
];

// Routes
router.post('/addshop', shopValidationRules, shopController.createShop);  // Create Shop
router.put('/updateShop/:id', shopValidationRules, shopController.updateShop);  // Update Shop
router.delete('/shop/:id', shopController.deleteShop);  // Delete Shop
router.get('/getshop/:id', shopController.getShop);  // Get Single Shop
router.get('/allshops', shopController.getAllShops);  // Get All Shops

// Logo Routes (all require authentication)
router.post('/upload-logo', decoderMiddleware, upload.single('logo'), shopController.uploadLogo);  // Upload Logo
router.get('/logo', decoderMiddleware, shopController.getLogo);  // Get Logo
router.delete('/logo', decoderMiddleware, shopController.deleteLogo);  // Delete Logo
router.get('/logo/:filename',decoderMiddleware ,shopController.serveLogo);  // Serve Logo File (no auth needed for direct access)

module.exports = router;
