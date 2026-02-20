const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["deposit", "withdrawal", "investment", "funding", "bot purchase"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "in progress", "approved", "declined"],
      default: "pending",
    },

    proof: [{ type: String, required: true }],

    address: {
      type: String,
    },

    mode: {
      type: String,
    },

    // plan should be botname for bot
    plan: {
      type: String,
    },
    dailyReturnPercent: {
      type: Number,
      min: 0,
    },
    durationDays: {
      type: Number,
      min: 1,
    },
    maxReturnPercent: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Transaction", transactionSchema);
