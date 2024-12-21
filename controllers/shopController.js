const Shop = require('../schema/ShopSchema');
const UserSchema = require('../schema/UserSchema');
const { validationResult } = require('express-validator');

// Create Shop
exports.createShop = async (req, res) => {
    const { name, shopName , termsCondition, address, contactNumber, shopId } = req.body;

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const shop = new Shop({
            name,
            shopName,
            termsCondition,
            address,
            contactNumber,
            shopId,
        });

        const savedShop = await shop.save();
        return res.status(201).json({
            message: "Shop created successfully!",
            shop: savedShop,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

// Update Shop
exports.updateShop = async (req, res) => {
    const { id } = req.params;
    const { name, shopName, termsCondition, address, contactNumber } = req.body;

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            id,
            {
                name,
                shopName,
                termsCondition,
                address,
                contactNumber,
            },
            { new: true }
        );

        if (!updatedShop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        return res.status(200).json({
            message: "Shop updated successfully!",
            shop: updatedShop,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

// Delete Shop
exports.deleteShop = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedShop = await Shop.findByIdAndDelete(id);

        if (!deletedShop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        return res.status(200).json({
            message: "Shop deleted successfully!",
            shop: deletedShop,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};

// Get a Single Shop by ID
exports.getShop = async (req, res) => {
    const { id } = req.params; // Extract `id` from request parameters

    try {
        // Find shop by `shopId` field
        const shop = await Shop.findOne({ shopId: id });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        return res.status(200).json({
            message: "Shop retrieved successfully!",
            shop: shop,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error, please try again",
            error: error.message,
        });
    }
};


// Get All Shops
exports.getAllShops = async (req, res) => {
    const { userId, userRole } = req.query;
  
    try {
      let shops = [];
  
      // Handle shop retrieval based on user role
      if (userRole === 'superadmin') {
        shops = await Shop.find({}).select('address name shopName contactNumber')
        .lean();
      } else if (userRole === 'admin') {
        // Find users associated with the admin's account
        const users = await UserSchema.find({ accountId: userId }).select('_id');
        const userIds = users.map((user) => user._id);
  
        // Retrieve shops associated with these users
        shops = await Shop.find({ shopId: { $in: userIds } }).select('address name shopName contactNumber')
        .lean();
      } else {
        return res.status(403).json({
          success: false,
          message: "Access denied. Invalid user role.",
        });
      }
  
      // Respond with the retrieved shops
      return res.status(200).json({
        success: true,
        message: "Shops retrieved successfully!",
        data: shops,
      });
  
    } catch (error) {
      console.error("Error retrieving shops:", error);
  
      // Handle internal server errors
      return res.status(500).json({
        success: false,
        message: "Internal server error, please try again.",
        error: error.message,
      });
    }
  };
  
