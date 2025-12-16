const express = require('express');
const router = express.Router();
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.Controller');
const authMiddleware = require('../middlewares/auth.middleware');



router.post('/register', validators.registerUserValidations, authController.register);
router.post('/login', validators.loginUserValidations, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.get('/logout',authController.logout);
router.get('/users/me/addresses',authMiddleware,authController.getUserAddresses);
router.post('/users/me/addresses',validators.addUserAddressValidations, authMiddleware,authController.addUserAddress);
router.delete('/users/me/addresses/:addressId',authMiddleware,authController.deleteUserAddress);
module.exports = router;