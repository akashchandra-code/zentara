const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const orderValidation = require("../middlewares/validation.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

// Create a new order

router.post(
  "/",
  authMiddleware(["user"]),
  orderValidation.createOrderValidation,
  orderController.createOrder
);
// Get orders for the logged-in user
router.get("/me",
     authMiddleware(["user"]), 
     orderController.getMyOrders
    );

// Get order by ID
router.get("/:orderId", authMiddleware(["user"]), orderController.getOrderById);
// Cancel an order
router.post(
  "/:orderId/cancel",
  authMiddleware(["user"]),
  orderController.cancelOrder
);

//update shipping address
router.patch(
  "/:id/address",
  authMiddleware(["user"]),
  orderValidation.updateAddressValidation,
  orderController.updateOrderAddress
);

module.exports = router;
