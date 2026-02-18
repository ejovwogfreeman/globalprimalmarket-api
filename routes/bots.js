const express = require("express");
const { protect } = require("../middlewares/auth");
const { getAllBots, getBot, purchaseBot } = require("../controllers/bots");
const { uploadTransactionFiles } = require("../middlewares/upload");

const router = express.Router();

router.get("/", protect, getAllBots);
router.get("/:id", protect, getBot);
router.post("/purchase", protect, uploadTransactionFiles, purchaseBot);

module.exports = router;
