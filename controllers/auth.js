const User = require("../models/user");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const Email = require("../middlewares/email");
const generateCode = require("../middlewares/generateCode");

const genToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );
};

/**
 * @desc Register user + send verification code
 */
register = async (req, res) => {
  try {
    const { fullName, userName, email, phoneNumber, country, password } =
      req.body;
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      if (!exists.isVerified) {
        // User exists but not verified
        return res.status(200).json({
          message:
            "Email already exists but not verified. Please verify your email.",
          user: {
            email: exists.email,
            isVerified: exists.isVerified,
          },
        });
      } else {
        // User exists and already verified
        return res.status(200).json({
          message: "Email already exists and is verified. Please login.",
          user: {
            email: exists.email,
            isVerified: exists.isVerified,
          },
        });
      }
    }

    // Generate verification code
    const verificationCode = generateCode();
    const user = await User.create({
      fullName,
      userName,
      email,
      phoneNumber,
      country,
      password,
      verificationCode,
      verificationCodeOld: null,
    });

    // Email the verification code
    await Email(
      user.email,
      "Verify Your Account",
      "register.html",
      { EMAIL: email, CODE: verificationCode }, // dynamic value
    );

    // Create notification
    await Notification.create({
      user: user._id,
      title: "Verify Your Email",
      message: `Enter the verification code sent to ${email}.`,
      meta: { userId: user._id },
    });

    if (global.io)
      global.io.emit("notification", {
        type: "user_registered",
        title: "New Registration",
        message: `${email} registered and needs to verify email.`,
        userId: user._id,
      });

    res.status(201).json({
      success: true,
      message: "Account created. Verification code sent to your email.",
      userId: user._id,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Verify account with code
 */
verifyAccount = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Account already verified" });

    if (Number(code) === user.verificationCodeOld)
      return res.status(400).json({
        message: "Verification code expired, please request a new one",
      });

    if (user.verificationCode !== Number(code))
      return res.status(400).json({ message: "Invalid verification code" });

    user.isVerified = true;
    user.verificationCodeOld = user.verificationCode;
    user.verificationCode = null;
    await user.save();

    // Email the verification code
    await Email(
      user.email,
      "Account Verified Successfully",
      "verify.html",
      { EMAIL: email }, // dynamic value
    );

    await Notification.create({
      user: user._id,
      title: "Account Verified",
      message: "Your email verification was successful!",
      meta: { userId: user._id },
    });

    if (global.io)
      global.io.emit("notification", {
        type: "user_verified",
        title: "New User Verified",
        message: `${email} registered and verified successfully.`,
        userId: user._id,
      });

    res
      .status(200)
      .json({ success: true, message: "Account verified successfully!" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};

resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Generate new verification code
    const verificationCode = generateCode();

    user.verificationCode = verificationCode;
    await user.save();

    // Resend verification email
    await Email(
      user.email,
      "Verify Your Account",
      "register.html",
      { EMAIL: email, CODE: verificationCode }, // dynamic value
    );

    // Create notification
    await Notification.create({
      user: user._id,
      title: "Verification Code Resent",
      message: `A new verification code has been sent to ${email}.`,
      meta: { userId: user._id },
    });

    // Emit socket notification (optional)
    if (global.io) {
      global.io.emit("notification", {
        type: "verification_resent",
        title: "Verification Resent",
        message: `Verification code resent to ${email}.`,
        userId: user._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Login with email/password
 */

login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // 🚫 STOP HERE if not verified
    if (!user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Please verify your email before logging in.",
        user: {
          email: user.email,
          isVerified: user.isVerified,
        },
      });
    }

    // ✅ Only verified users reach here
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Send email ONLY for verified users
    await Email(user.email, "Login Successful", "login.html", { EMAIL: email });

    await Notification.create({
      user: user._id,
      title: "Login Successful",
      message: "You logged in successfully.",
      meta: { userId: user._id },
    });

    if (global.io) {
      global.io.emit("notification", {
        type: "user_login",
        title: "User Logged In",
        message: `${user.name} logged in.`,
        userId: user._id,
      });
    }

    return res.json({
      success: true,
      token: genToken(user),
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const code = generateCode();
    user.verificationCode = code;
    await user.save();

    await Email(user.email, "Forget Password", "forget_password.html", {
      EMAIL: email,
      CODE: user.verificationCode,
    });

    res.json({
      success: true,
      message: "Password reset email sent. Check your inbox for the code.",
    });
  } catch (err) {
    console.error("Forget Password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

changePassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate input
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Number(code) === user.verificationCodeOld)
      return res.status(400).json({
        message: "Verification code expired, please request a new one",
      });

    // Verify code
    if (user.verificationCode !== Number(code)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update password (hashed via model pre-save)
    user.password = newPassword;

    // Store old code (optional audit) and clear active code
    user.verificationCodeOld = user.verificationCode;
    user.verificationCode = null;

    await user.save();

    // ✅ Send confirmation email
    await Email(
      user.email,
      "Password Changed Successfully",
      "change_password.html",
      {
        EMAIL: email,
      },
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  register,
  verifyAccount,
  resendVerificationCode,
  login,
  forgetPassword,
  changePassword,
};
