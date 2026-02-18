const Bot = require("../models/bot");
const Transaction = require("../models/transactions");
const { uploadImages } = require("../middlewares/cloudinary");

// GET /bots
exports.getAllBots = async (req, res) => {
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

// GET /bots/:id
exports.getBot = async (req, res) => {
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

exports.purchaseBot = async (req, res) => {
  try {
    const { mode, amount } = req.body;
    const user = req.user;

    // ---- VALIDATION ----
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!mode) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    if (!req.files?.proofs || req.files.proofs.length === 0) {
      return res
        .status(400)
        .json({ message: "Purchase proof image is required" });
    }

    // ---- CHECK USER BALANCE ----
    const userBalance = user.balance?.[mode];

    if (userBalance === undefined) {
      return res.status(400).json({
        message: `Invalid payment mode selected`,
      });
    }

    if (Number(userBalance) < Number(amount)) {
      return res.status(400).json({
        message: `Insufficient ${mode} balance`,
      });
    }

    // ---- FILE UPLOAD ----
    const proofImages = req.files.proof;
    let uploadedProofs = [];

    if (proofImages.length > 0) {
      uploadedProofs = await uploadImages(proofImages, "purchases/proofs");
    }

    // ---- CREATE TRANSACTION ----
    const transactionData = {
      user: user._id,
      type: "bot purchase",
      amount,
      mode,
      proof: uploadedProofs,
      status: "pending",
    };

    const transaction = await Transaction.create(transactionData);

    // ---- OPTIONAL: DEDUCT BALANCE (if you want immediate deduction) ----
    // user.balance[mode] -= Number(amount);
    // await user.save();

    // ---- EMAIL ----
    await Email(user.email, "Bot Purchase Submitted", "bot-purchase.html", {
      EMAIL: user.email,
      AMOUNT: amount,
      MODE: mode,
    });

    return res.status(201).json({
      success: true,
      message: "Bot purchase request submitted successfully",
      transaction,
    });
  } catch (error) {
    console.error("Purchase bot error:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting bot purchase",
    });
  }
};
