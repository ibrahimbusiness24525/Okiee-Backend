const express = require('express');
const { check } = require('express-validator');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post(
  '/addUser/:accountId',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password must be 8 or more characters').isLength({ min: 8 })
  ],
  adminController.register
);

router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').exists()
  ],
  adminController.login
);

router.post(
  '/getAlluser',
  adminController.getAllUsersExceptCurrent
);

router.put('/updateUser',
   adminController.updateUser);

router.put('/updateUserPassword',
   adminController.updatePassword);

router.put('/activateDeactivateUser',
   adminController.toggleUserStatus);

router.post('/send-email',
   adminController.sendEmail);

module.exports = router;
