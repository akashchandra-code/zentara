const orderModel = require("../models/order.model");
const axios = require("axios");

async function createOrder(req, res) {
  try {
    const user = req.user;

    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 1️⃣ Get Cart
    const cartResponse = await axios.get("http://localhost:3002/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const cartItems = cartResponse.data.cart.items;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2️⃣ Fetch Products
    const products = await Promise.all(
      cartItems.map(async (item) => {
        const productResponse = await axios.get(
          `http://localhost:3001/api/products/${item.productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return productResponse.data.data;
      })
    );

    let priceAmount = 0;

    // 3️⃣ Create Order Items
    const orderItems = cartItems.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Product ${product.title} has insufficient stock`);
      }

      const itemTotal = product.price.amount * item.quantity;
      priceAmount += itemTotal;

      return {
        product: product._id,
        quantity: item.quantity,
        price: {
          amount: itemTotal,
          currency: product.price.currency,
        },
      };
    });

    // 4️⃣ Create Order
    const order = await orderModel.create({
      user: user.id,
      items: orderItems,
      status: "PENDING",
      totalPrice: {
        amount: priceAmount,
        currency: "INR",
      },
      shippingAddress: {
        street: req.body.shippingAddress.street,
        city: req.body.shippingAddress.city,
        state: req.body.shippingAddress.state,
        zip: req.body.shippingAddress.pincode,
        country: req.body.shippingAddress.country,
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function getMyOrders(req, res) {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const orders = await orderModel
      .find({ user: user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOrders = await orderModel.countDocuments({ user: user.id });
    const totalPages = Math.ceil(totalOrders / limit);
    res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function getOrderById(req, res) {
  const user = req.user;
  const orderId = req.params.orderId;
  
  try {
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
      if (order.user.toString() !== user.id) {
        return res.status(403).json({
          message: "Forbidden: You do not have access to this order",
        });
      }
    }
    res.status(200).json({
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function cancelOrder(req, res) {
  const user = req.user;
  const orderId = req.params.orderId;
  try {
    const order = await orderModel.findOne({ _id: orderId, user: user.id });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    if (order.status === "CANCELLED") {
      return res.status(400).json({
        message: "Order is already cancelled",
      });
    }
    order.status = "CANCELLED";
    await order.save();
    res.status(200).json({
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function updateOrderAddress(req, res) {
  const user = req.user;
  const orderId = req.params.id;
  try {
    const order = await orderModel.findOne({ _id: orderId, user: user.id });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Order cannot be updated as it is not in pending status",
      });
    }
    order.shippingAddress = {
      street: req.body.shippingAddress.street,
      city: req.body.shippingAddress.city,
      state: req.body.shippingAddress.state,
      zip: req.body.shippingAddress.pincode,
      country: req.body.shippingAddress.country,
    };
    await order.save();
    res.status(200).json({
      message: "Order address updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order address:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderAddress,
};
