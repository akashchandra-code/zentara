const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const validation=require('../middlewares/validation.middleware');
const createAuthMiddleware=require('../middlewares/auth.middleware');


router.post('/items',
    createAuthMiddleware(['user']),
    validation.validateAddItemToCart,
    cartController.addItemToCart
);

router.get('/',
    createAuthMiddleware(['user']),
    cartController.getCartByUserId
);
router.patch('/items/:productId',
    createAuthMiddleware(['user']),
    validation.validateUpdateCartItem,
    cartController.updateCartItem
);
router.delete('/items/:productId',
    createAuthMiddleware(['user']),
    cartController.removeItemFromCart
);
router.delete('/',
    createAuthMiddleware(['user']),
    cartController.clearCart
);
module.exports = router;