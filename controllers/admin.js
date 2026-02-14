const User = require("../models/user");
const Transaction = require("../models/transactions");
const Bot = require("../models/bot.js");

/**
 * @desc Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Admins only" });
    }

    const users = await User.find().select("-password");
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("GetAllUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a single user by ID (admin only)
 */
const getSingleUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Admins only" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("GetSingleUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Update a user (admin only)
 */
const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { fullName, email, phoneNumber, country, role, isVerified } =
      req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;

    await user.save();
    res.json({ success: true, message: "User updated successfully", user });
  } catch (err) {
    console.error("UpdateUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Delete a user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Fund a user (admin only)
 */
const fundUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance += parseFloat(amount);
    await user.save();

    // Optional: create a transaction record
    const transaction = await Transaction.create({
      user: user._id,
      amount: parseFloat(amount),
      type: "deposit",
      status: "approved",
      mode: "admin",
    });

    res.json({
      success: true,
      message: "User funded successfully",
      user,
      transaction,
    });
  } catch (err) {
    console.error("FundUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get all transactions (admin only)
 */
const getAllTransactions = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Admins only" });
    }

    const transactions = await Transaction.find()
      .populate("user", "email")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    console.error("GetAllTransactions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a single transaction by ID (admin only)
 */
const getSingleTransaction = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Admins only" });
    }

    const transaction = await Transaction.findById(req.params.id).populate(
      "user",
      "email",
    );
    if (!transaction)
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });

    res.status(200).json({ success: true, transaction });
  } catch (err) {
    console.error("GetSingleTransaction error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Update transaction status (admin only)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "in progress", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    const user = await User.findById(transaction.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Apply balance changes
    if (transaction.status === "pending" && status === "approved") {
      if (transaction.type === "deposit") user.balance += transaction.amount;
      if (["withdrawal", "investment"].includes(transaction.type)) {
        if (user.balance < transaction.amount)
          return res.status(400).json({ message: "Insufficient balance" });
        user.balance -= transaction.amount;
      }
    }

    // Rollback
    if (transaction.status === "approved" && status === "pending") {
      if (transaction.type === "deposit") user.balance -= transaction.amount;
      if (["withdrawal", "investment"].includes(transaction.type))
        user.balance += transaction.amount;
    }

    transaction.status = status;

    await user.save();
    await transaction.save();

    res.json({
      success: true,
      message: "Transaction status updated successfully",
      transaction,
    });
  } catch (err) {
    console.error("UpdateTransactionStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Delete a transaction (admin only)
 */
const deleteTransaction = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    await transaction.deleteOne();
    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("DeleteTransaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL BOTS
const getAllBots = async (req, res) => {
  try {
    const bots = await Bot.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      bots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bots",
    });
  }
};

// GET SINGLE BOT BY ID
const getSingleBot = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findById(id);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.status(200).json({
      success: true,
      bot,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching the bot",
    });
  }
};

const createBot = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      dailyReturnPercent,
      durationDays,
      maxReturnPercent,
    } = req.body;

    if (
      !name ||
      !price ||
      !dailyReturnPercent ||
      !durationDays ||
      !maxReturnPercent
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (price < 50 || price > 1000) {
      return res.status(400).json({
        success: false,
        message: "Bot price must be between $50 and $1000",
      });
    }

    const bot = await Bot.create({
      name,
      description,
      price,
      dailyReturnPercent,
      durationDays,
      maxReturnPercent,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Bot created successfully",
      bot,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateBot = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBot = await Bot.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bot updated successfully",
      bot: updatedBot,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const toggleBotStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findById(id);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    bot.status = bot.status === "active" ? "inactive" : "active";
    await bot.save();

    res.status(200).json({
      success: true,
      message: `Bot is now ${bot.status}`,
      bot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteBot = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findByIdAndDelete(id);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bot deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  fundUser,
  getAllTransactions,
  getSingleTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getAllBots,
  getSingleBot,
  createBot,
  updateBot,
  toggleBotStatus,
  deleteBot,
};
