const { sign } = require("jsonwebtoken");
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    razorpayOrderId: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    PaymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    price: {
      amount: { type: Number, required: true },
      currency: {
        type: String,
        required: true,
        default: "INR",
        enum: ["INR", "USD"],
      },
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("payment", paymentSchema);

module.exports = Payment;
