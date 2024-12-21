const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { body } = require('express-validator');

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

module.exports = router;
