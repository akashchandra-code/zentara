const mongoose = require("mongoose");

const adderessSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  phone: String,
  isDefault: { type: Boolean, default: false },
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    select: false,
  },
  fullname: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
  },
  role: {
    type: String,
    enum: ["user", "seller"],
    default: "user",
  },
  addresses: [adderessSchema],
});

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
