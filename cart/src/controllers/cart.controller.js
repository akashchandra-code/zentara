const cartModel = require('../models/cart.model');


// Get cart by user ID 
async function getCartByUserId(req, res) {
    const userId = req.user.id;
    try {
        let cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            cart = new cartModel({ user: userId, items: [] });
            await cart.save();
        }   
        res.status(200).json({
        cart,
        totals: {
            itemCount: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
    });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// Add item to cart
async function addItemToCart(req, res) {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
    try {
        let cart = await cartModel.findOne({ user: userId });   
        if (!cart) {
            cart = new cartModel({ user: userId, items: [] });
        }
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// Update item quantity in cart
async function updateCartItem(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    try {
        const cart = await cartModel.findOne({ user: userId }); 
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;  
            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }   
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Remove item from cart
async function removeItemFromCart(req, res) {
    const { productId } = req.params;
    const userId = req.user.id;
    try {
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// clear cart
async function clearCart(req, res) {
    const userId = req.user.id;
    try {
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.items = [];
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getCartByUserId,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart
};