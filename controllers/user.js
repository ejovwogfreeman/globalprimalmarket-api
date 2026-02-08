const User = require("../models/user");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
// const Email = require("../middlewares/email");
// const generateCode = require("../middlewares/generateCode");
const { uploadImages } = require("../middlewares/cloudinary");

/**
 * @desc Get logged-in user
 */
getMe = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GetMe error:", err.message);

    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired" });

    res.status(401).json({ message: "Invalid or missing token" });
  }
};

updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, userName, phoneNumber, country, countryFlag } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (userName) user.userName = userName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (countryFlag) user.countryFlag = countryFlag;

    await user.save();

    // ---------------------------
    // NOTIFY ADMINS
    // ---------------------------
    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      // Create notification in DB
      const notif = await Notification.create({
        user: admin._id,
        title: "User Profile Updated",
        message: `${user.name} updated their profile information`,
        meta: {
          updatedFields: {
            fullName,
            userName,
            phoneNumber,
            country,
            countryFlag,
          },
          userId: user._id,
        },
      });

      // Emit live notification via socket if admin is online
      const adminSocketId = global.onlineUsers.get(admin._id.toString());
      if (adminSocketId) {
        global.io.to(adminSocketId).emit("notification", notif);
      }
    }

    res.json({ success: true, message: "User updated successfully", user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

changeProfilePicture = async (req, res) => {
  try {
    const user = req.user; // should come from your auth middleware

    // ---- VALIDATION ----
    if (!req.files?.image || req.files.image.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Profile picture file is required",
      });
    }

    // ---- UPLOAD FILE ----

    const images = req.files.images;
    let uploadedFiles = [];
    if (images.length > 0) {
      uploadedFiles = await uploadImages(images, "users/profile-pictures");
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
      });
    }

    // ---- UPDATE USER ----
    user.profilePicture = uploadedFiles; // take first uploaded URL/string
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Change profile picture error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile picture",
      error: error.message,
    });
  }
};

module.exports = {
  getMe,
  updateProfile,
  changeProfilePicture,
};
