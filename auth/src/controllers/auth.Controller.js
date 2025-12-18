const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
async function register(req, res) {
  try {
    const { username, email, password, fullname, role } = req.body;
    const { firstname, lastname } = fullname;
    const isAlreadyExist = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (isAlreadyExist) {
      return res
        .status(400)
        .json({ message: " email or username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      username,
      email,
      password: hashedPassword,
      fullname: { firstname, lastname },
      role: role || "user",
    });
    await newUser.save();
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
         token,
        fullname: newUser.fullname,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function login(req, res) {
  try {
    const { username, email, password } = req.body;
    const user = await userModel
      .findOne({ $or: [{ email }, { username }] })
      .select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    message: "Current user fetched successfully",
    user: req.user,
  });
}

async function logout(req, res) {
  const token = req.cookies?.token;
  if (token && process.env.NODE_ENV !== "test") {
    await redis.set(`blacklist_${token}`, "true", "EX", 24 * 60 * 60);
  }
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({ message: "Logged out successfully" });
}
async function getUserAddresses(req, res) {
  const id = req.user._id;

  const user = await userModel.findById(id).select("addresses");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ addresses: user.addresses });
}
async function addUserAddress(req, res) {
  const id = req.user._id;
  const { street, city, state, pincode, country, phone, isDefault } = req.body;
  const user = await userModel.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.addresses.push({ street, city, state, pincode, country, phone,isDefault: !!isDefault, });
  await user.save();
  return res.status(201).json({
    message: "Address added successfully",
    address: user.addresses[user.addresses.length - 1],
  });
}
async function deleteUserAddress(req, res) {
    const id = req.user.id;
    const { addressId } = req.params;


    const isAddressExists = await userModel.findOne({ _id: id, 'addresses._id': addressId });


    if (!isAddressExists) {
        return res.status(404).json({ message: "Address not found" });
    }

    const user = await userModel.findOneAndUpdate({ _id: id }, {
        $pull: {
            addresses: { _id: addressId }
        }
    }, { new: true });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const addressExists = user.addresses.some(addr => addr._id.toString() === addressId);
    if (addressExists) {
        return res.status(500).json({ message: "Failed to delete address" });
    }

    return res.status(200).json({
        message: "Address deleted successfully",
        addresses: user.addresses
    });
}
module.exports = {
  register,
  login,
  getMe,
  logout,
  getUserAddresses,
  addUserAddress,
    deleteUserAddress
};
