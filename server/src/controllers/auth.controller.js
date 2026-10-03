const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Signup
const signup = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      role,
      location,
    } = req.body;

    // Validate required fields
    if (!name || !phone || !password || !role) {
      return res.status(400).json({
        message: "Name, phone, password and role are required",
      });
    }

    // Only these roles can register through public signup
    const allowedRoles = [
      "farmer",
      "buyer",
      "fpo",
      "arthiya",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check whether phone already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this phone number already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      phone,
      passwordHash,
      role,
      location,
      verificationStatus:
        role === "farmer" || role === "buyer"
          ? "verified"
          : "pending",
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        location: user.location,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    // Explicitly select passwordHash because the User model
    // hides it by default
    const user = await User.findOne({ phone }).select(
      "+passwordHash"
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid phone number or password",
      });
    }

    // Check whether account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // Compare entered password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid phone number or password",
      });
    }

    // JWT secret must exist in environment variables
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        location: user.location,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
};