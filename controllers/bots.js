// const Transaction = require("../models/transactions");
const Bot = require("../models/bot");

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
