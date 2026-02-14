// const User = require("../models/user");
// const Transaction = require("../models/transactions");

// /**
//  * @desc Get all users (admin only)
//  */
// const getAllUsers = async (req, res) => {
//   try {
//     // Make sure only admins can access
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ success: false, message: "Access denied: Admins only" });
//     }

//     // Fetch all users, exclude passwords
//     const users = await User.find().select("-password");

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       users,
//     });
//   } catch (err) {
//     console.error("GetAllUsers error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /**
//  * @desc Get a single user by ID (admin only)
//  */
// const getSingleUser = async (req, res) => {
//   try {
//     // Only admins allowed
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ success: false, message: "Access denied: Admins only" });
//     }

//     const { id } = req.params;

//     const user = await User.findById(id).select("-password");
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({ success: true, user });
//   } catch (err) {
//     console.error("GetSingleUser error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /**
//  * @desc Get all transactions (admin only)
//  */
// const getAllTransactions = async (req, res) => {
//   try {
//     // Only admins allowed
//     if (req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied: Admins only",
//       });
//     }

//     const transactions = await Transaction.find()
//       .populate("user", "email") // optional if you reference User
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: transactions.length,
//       transactions,
//     });
//   } catch (err) {
//     console.error("GetAllTransactions error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /**
//  * @desc Get a single transaction by ID (admin only)
//  */
// const getSingleTransaction = async (req, res) => {
//   try {
//     // Only admins allowed
//     if (req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied: Admins only",
//       });
//     }

//     const { id } = req.params;

//     const transaction = await Transaction.findById(id).populate(
//       "user",
//       "email",
//     );

//     if (!transaction) {
//       return res.status(404).json({
//         success: false,
//         message: "Transaction not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       transaction,
//     });
//   } catch (err) {
//     console.error("GetSingleTransaction error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// exports.updateTransactionStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["pending", "approved", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status value",
//       });
//     }

//     const transaction = await Transaction.findById(req.params.id);
//     if (!transaction) {
//       return res.status(404).json({
//         message: "Transaction not found",
//       });
//     }

//     if (transaction.status === status) {
//       return res.status(400).json({
//         message: "Transaction already has this status",
//       });
//     }

//     const user = await User.findById(transaction.user);
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // APPLY BALANCE CHANGES
//     if (transaction.status === "pending" && status === "approved") {
//       if (transaction.type === "deposit") {
//         user.balance += transaction.amount;
//       }

//       if (
//         transaction.type === "withdrawal" ||
//         transaction.type === "investment"
//       ) {
//         if (user.balance < transaction.amount) {
//           return res.status(400).json({
//             message: "Insufficient balance",
//           });
//         }
//         user.balance -= transaction.amount;
//       }
//     }

//     // ROLLBACK
//     if (transaction.status === "approved" && status === "pending") {
//       if (transaction.type === "deposit") {
//         user.balance -= transaction.amount;
//       }

//       if (
//         transaction.type === "withdrawal" ||
//         transaction.type === "investment"
//       ) {
//         user.balance += transaction.amount;
//       }
//     }

//     transaction.status = status;

//     await user.save();
//     await transaction.save();

//     return res.json({
//       message: "Transaction status updated successfully",
//       transaction,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   getAllUsers,
//   getSingleUser, // export new function
//   getAllTransactions,
//   getSingleTransaction,
// };

const User = require("../models/user");
const Transaction = require("../models/transactions");

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
};
