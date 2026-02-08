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

    const user = await User.findById(req.user.id);
    if (!user || user.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
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

    // Email the verification code
    await Email(
      user.email,
      "Withdraw Successful",
      "withdraw.html",
      { EMAIL: user.email, AMOUNT: amount, CURRENCY: mode }, // dynamic value
    );

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
    const { amount, plan } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: "investment",
      amount,
      plan,
      status: "in progress",
    });

    // Email the verification code
    await Email(
      user.email,
      "Investment Successful",
      "investment.html",
      { EMAIL: user.email, AMOUNT: amount, PLAN_NAME: plan }, // dynamic value
    );

    return res.status(201).json({
      success: true,
      message: "Investment reequest submitted successfully",
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

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "email balance")
      .sort({ createdAt: -1 });

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

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (transaction.status === status) {
      return res.status(400).json({
        message: "Transaction already has this status",
      });
    }

    const user = await User.findById(transaction.user);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // APPLY BALANCE CHANGES
    if (transaction.status === "pending" && status === "approved") {
      if (transaction.type === "deposit") {
        user.balance += transaction.amount;
      }

      if (
        transaction.type === "withdrawal" ||
        transaction.type === "investment"
      ) {
        if (user.balance < transaction.amount) {
          return res.status(400).json({
            message: "Insufficient balance",
          });
        }
        user.balance -= transaction.amount;
      }
    }

    // ROLLBACK
    if (transaction.status === "approved" && status === "pending") {
      if (transaction.type === "deposit") {
        user.balance -= transaction.amount;
      }

      if (
        transaction.type === "withdrawal" ||
        transaction.type === "investment"
      ) {
        user.balance += transaction.amount;
      }
    }

    transaction.status = status;

    await user.save();
    await transaction.save();

    return res.json({
      message: "Transaction status updated successfully",
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
