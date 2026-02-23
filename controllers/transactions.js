const Transaction = require("../models/transactions");
const User = require("../models/user");
const { uploadImages } = require("../middlewares/cloudinary");
const Email = require("../middlewares/email");

exports.createDeposit = async (req, res) => {
  try {
    const { amount, mode } = req.body;
    const user = req.user;

    // ---- VALIDATION ----
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    if (!req.files?.images || req.files.images.length === 0) {
      return res.status(400).json({
        message: "Deposit proof image is required",
      });
    }

    // ---- FILES ----
    const images = req.files.images;
    let uploadedProofs = [];

    if (images.length > 0) {
      uploadedProofs = await uploadImages(images, "deposits/proofs");
    }

    // ---- TRANSACTION DATA ----
    const transactionData = {
      user: user._id,
      type: "deposit",
      amount,
      mode, // bank, crypto, transfer
      proof: uploadedProofs, // array of uploaded images
      status: "pending",
    };

    const transaction = await Transaction.create(transactionData);

    // Email the verification code
    await Email(
      user.email,
      "Deposit Successful",
      "deposit.html",
      { EMAIL: user.email, AMOUNT: amount, CURRENCY: mode }, // dynamic value
    );

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create deposit error:", error);
    return res.status(500).json({
      message: "Error submitting deposit",
      error,
    });
  }
};

exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, mode, address } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    if (!mode) {
      return res.status(400).json({
        message: "Withdrawal mode is required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Ensure balance object exists and mode exists inside it
    if (
      !user.balance ||
      !user.balance[mode] ||
      Number(user.balance[mode]) < Number(amount)
    ) {
      return res.status(400).json({
        message: `Insufficient ${mode} balance`,
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: "withdrawal",
      amount,
      mode,
      address,
      status: "pending",
    });

    // Email notification
    await Email(user.email, "Withdraw Successful", "withdraw.html", {
      EMAIL: user.email,
      AMOUNT: amount,
      CURRENCY: mode,
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createInvestment = async (req, res) => {
  try {
    const {
      amount,
      mode,
      plan,
      dailyReturnPercent,
      durationDays,
      maxReturnPercent,
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (dailyReturnPercent === undefined || dailyReturnPercent < 0) {
      return res.status(400).json({ message: "Invalid dailyReturnPercent" });
    }
    if (!durationDays || durationDays < 1) {
      return res.status(400).json({ message: "Invalid durationDays" });
    }
    if (maxReturnPercent === undefined || maxReturnPercent < 0) {
      return res.status(400).json({ message: "Invalid maxReturnPercent" });
    }

    // Check user and balance
    const user = await User.findById(req.user.id);
    if (!user || user.balance[mode] < amount) {
      return res.status(400).json({ message: `Insufficient ${mode} balance` });
    }

    // Create the investment transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type: "investment",
      amount,
      mode,
      plan,
      dailyReturnPercent,
      durationDays,
      maxReturnPercent,
      status: "in progress",
    });

    // Email notification
    await Email(
      user.email,
      "Investment Successful",
      "investment.html",
      { EMAIL: user.email, AMOUNT: amount, CURRENCY: mode, PLAN_NAME: plan }, // dynamic values
    );

    return res.status(201).json({
      success: true,
      message: "Investment request submitted successfully",
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the transaction by ID
    const transaction = await Transaction.findById(id).populate(
      "user",
      "name email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Optional: ensure the transaction belongs to the logged-in user
    // if (transaction.user._id.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Unauthorized access",
    //   });
    // }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
