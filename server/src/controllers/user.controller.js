const User = require("../models/User");

const createUser = async (req, res) => {
  try {
    const { name, phone, role, location } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and role are required",
      });
    }

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this phone number already exists",
      });
    }

    const user = await User.create({
      name,
      phone,
      role,
      location,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "location",
      "isActive",
    ];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (
      !["pending", "verified", "rejected"].includes(
        verificationStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification status",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification status updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUserById,
  updateUser,
  updateVerificationStatus,
};