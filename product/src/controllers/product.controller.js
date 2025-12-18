const productModel = require('../models/product.model');
const {uploadImage} = require('../services/imagekit.service');

async function createProductController(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;
        const seller = req.user.id; // Extract seller from authenticated user

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency,
        };
        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));


        const product = await productModel.create({ title, description, price, seller, images });
        return res.status(201).json({
            message: 'Product created',
            data: product,
        });
    } catch (err) {
        console.error('Create product error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createProductController };
