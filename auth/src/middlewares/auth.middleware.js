const userModel = require("../models/user.model");
const jwt= require("jsonwebtoken");

async function authmiddleware(req, res, next) {
    const token =  req.cookies?.token ||   
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }   
        req.user = user;
        next();
    } catch (error) {
        return  res.status(401).json({ message: "Invalid token" }); 
    }
}

module.exports = authmiddleware;