const productModel = require("../models/product.model");
const { uploadImage } = require("../services/imagekit.service");
const mongoose = require("mongoose");
async function createProductController(req, res) {
  try {
    const { title, description, priceAmount, priceCurrency = "INR", stock } = req.body;
    const seller = req.user.id; // Extract seller from authenticated user

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };
    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer }))
    );

    const product = await productModel.create({
      title,
      description,
      price,
      seller,
      images,
      stock: Number(stock),
    });
    return res.status(201).json({
      message: "Product created",
      data: product,
    });
  } catch (err) {
    console.error("Create product error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
async function getProductsController(req, res) {
  const { q, minPrice, maxPrice, skip = 0, limit = 20 } = req.query;
  const filter = {};
  if (q) {
    filter.$text = { $search: q };
  }
  if (minPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $gte: Number(minPrice),
    };
  }
  if (maxPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $lte: Number(maxPrice),
    };
  }
  const products = await productModel
    .find(filter)
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));
  return res.status(200).json({
    message: "Products retrieved",
    data: products,
  });
}

async function getProductByIdController(req, res) {
  const { id } = req.params;
  const product = await productModel.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.status(200).json({
    message: "Product retrieved",
    data: product,
  });
}
async function updateProductController(req, res) {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await productModel.findOne({ _id: id});
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if(product.seller.toString()!==req.user.id){
        return res.status(403).json({ message: "Forbidden: You are not the seller of this product" });
    }
    const allowedUpdates = ['title', 'description', 'priceAmount', 'priceCurrency', 'stock'];

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            if (field === 'priceAmount') {
                product.price.amount = Number(req.body[field]);
            } else if (field === 'priceCurrency') {
                product.price.currency = req.body[field];
            } else {
                product[field] = req.body[field];
            }
        }
    });

    await product.save();
    return res.status(200).json({
      message: "Product updated",
      data: product,
    });
}
async function deleteProductController(req, res) {
  const { id } = req.params;
  const product = await productModel.findByIdAndDelete(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.status(200).json({
    message: "Product deleted",
  });
}

module.exports = {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
};
