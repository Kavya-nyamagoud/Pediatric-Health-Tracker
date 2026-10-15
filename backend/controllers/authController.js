// backend/controllers/authController.js
const db = require("../models");

// Try to resolve User model from models/index (preferred) or fallback to direct file
let User = null;
if (db && db.User) {
  User = db.User;
} else {
  try {
    User = require("../models/User");
  } catch (err) {
    console.error("authController: Could not load User model from ../models or ../models/User:", err.message || err);
  }
}

// helper: send token + user info
function sendTokenResponse(userInstance, statusCode, res) {
  try {
    const token = userInstance && typeof userInstance.getSignedJwtToken === "function"
      ? userInstance.getSignedJwtToken()
      : null;

    return res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: userInstance.id,
        name: userInstance.name,
        email: userInstance.email,
        role: userInstance.role,
      },
    });
  } catch (err) {
    console.error("sendTokenResponse error:", err);
    return res.status(500).json({ success: false, message: "Could not create token response" });
  }
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    if (!User) return res.status(500).json({ success: false, message: "User model not available on server" });

    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists with that email" });
    }

    const allowed = ["parent", "doctor", "admin"];
    const userRole = allowed.includes(role) ? role : "parent";

    const newUser = await User.create({ name, email, password, role: userRole });
    return sendTokenResponse(newUser, 201, res);
  } catch (err) {
    console.error("authController.register error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    if (!User) return res.status(500).json({ success: false, message: "User model not available on server" });

    const { email, password, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing email/password" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (role && user.role && user.role !== role) {
      return res.status(403).json({ success: false, message: `You are registered as '${user.role}', not '${role}'` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

    return sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error("authController.login error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};
