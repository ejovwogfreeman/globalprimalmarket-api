const express = require("express");
const router = express.Router();
// const authController = require("../controllers/auth");
const {
  register,
  verifyAccount,
  resendVerificationCode,
  forgetPassword,
  changePassword,
  login,
} = require("../controllers/auth");
const { protect } = require("../middlewares/auth");
const { uploadNone } = require("../middlewares/upload");

// ------------------------
// Normal registration
// Body: { name, email, password, role }
router.post("/register", uploadNone, register);

// ------------------------
// Account Verification
// Body: { email, code }
router.post("/verify", verifyAccount);

// ------------------------
// Account Verification
// Body: { email, code }
router.post("/resend-verification", resendVerificationCode);

// ------------------------
// Normal login
// Body: { email, password }
router.post("/login", uploadNone, login);

// Forget password (normal users only)
router.post("/forget-password", forgetPassword);

// Change password (normal users only)
router.post("/change-password", changePassword);

// ------------------------
// Get logged-in user info
// router.get("/me", protect, getMe);

// router.get("/send-email", sendEmail);

// ------------------------
// Optional: Admin-only route example
// router.get("/all-users", protect, authorize("admin"), getAllUsers);

module.exports = router;
